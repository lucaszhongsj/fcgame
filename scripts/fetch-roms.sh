#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE="${1:-rom-sources.json}"
OUTPUT_ROOT="${2:-roms}"
REPORT_FILE="${3:-download-report.json}"
FAIL_ON_ERROR="${FAIL_ON_ERROR:-0}"
GENERATED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "config file not found: $CONFIG_FILE" >&2
    exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required" >&2
    exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
    echo "curl is required" >&2
    exit 1
fi

jq -e '.sources and (.sources | type == "array")' "$CONFIG_FILE" >/dev/null

tmpdir="$(mktemp -d)"
source_lines_file="$tmpdir/source-lines.jsonl"
report_lines_file="$tmpdir/report-lines.jsonl"
: > "$source_lines_file"
: > "$report_lines_file"

sanitize_slug() {
    printf '%s' "$1" \
        | tr '[:upper:]' '[:lower:]' \
        | sed -E 's/\.nes$//I; s/[^a-z0-9._-]+/-/g; s/^-+//; s/-+$//; s/-+/-/g'
}

append_report_line() {
    local source_repo="$1"
    local name="$2"
    local path_value="$3"
    local status="$4"
    local reason="${5:-}"
    local bytes="${6:-0}"
    jq -n \
        --arg source_repo "$source_repo" \
        --arg name "$name" \
        --arg path "$path_value" \
        --arg status "$status" \
        --arg reason "$reason" \
        --arg generated_at "$GENERATED_AT" \
        --argjson bytes "$bytes" \
        '{
            source_repo: $source_repo,
            name: $name,
            path: $path,
            status: $status,
            reason: $reason,
            bytes: $bytes,
            generated_at: $generated_at
        }' >> "$report_lines_file"
}

jq -c '.sources[]' "$CONFIG_FILE" | while read -r source_json; do
    source_repo="$(printf '%s' "$source_json" | jq -r '.source_repo // empty')"
    source_display_name="$(printf '%s' "$source_json" | jq -r '.display_name // .source_repo // empty')"
    if [[ -z "$source_repo" ]]; then
        append_report_line "unknown" "unknown" "" "failed" "missing_source_repo"
        continue
    fi

    source_dir="$OUTPUT_ROOT/$source_repo"
    mkdir -p "$source_dir"

    manifest_lines_file="$tmpdir/manifest-${source_repo}.jsonl"
    : > "$manifest_lines_file"

    printf '%s' "$source_json" | jq -c '.items // [] | .[]' | while read -r item_json; do
        item_name="$(printf '%s' "$item_json" | jq -r '.name // empty')"
        item_display_name="$(printf '%s' "$item_json" | jq -r '.display_name // .name // empty')"
        item_rom_url="$(printf '%s' "$item_json" | jq -r '.rom_url // empty')"
        item_license="$(printf '%s' "$item_json" | jq -r '.license // empty')"
        item_license_url="$(printf '%s' "$item_json" | jq -r '.license_url // empty')"
        item_homepage="$(printf '%s' "$item_json" | jq -r '.homepage // empty')"

        if [[ -z "$item_name" || -z "$item_rom_url" ]]; then
            append_report_line "$source_repo" "$item_name" "" "failed" "missing_required_fields"
            continue
        fi

        slug="$(sanitize_slug "$item_name")"
        if [[ -z "$slug" ]]; then
            append_report_line "$source_repo" "$item_name" "" "failed" "invalid_name"
            continue
        fi

        output_file="$source_dir/$slug.nes"
        output_path="$output_file"
        if curl --retry 3 --retry-delay 2 --max-time 120 -fsSL "$item_rom_url" -o "$output_file"; then
            file_size="$(wc -c < "$output_file" | tr -d ' ')"
            append_report_line "$source_repo" "$item_name" "$output_path" "success" "" "$file_size"
            jq -n \
                --arg name "$item_display_name" \
                --arg slug "$slug" \
                --arg path "$output_path" \
                --arg rom_url "$item_rom_url" \
                --arg license "$item_license" \
                --arg license_url "$item_license_url" \
                --arg homepage "$item_homepage" \
                '{
                    name: $name,
                    slug: $slug,
                    path: $path,
                    rom_url: $rom_url,
                    license: $license,
                    license_url: $license_url,
                    homepage: $homepage
                }' >> "$manifest_lines_file"
        else
            append_report_line "$source_repo" "$item_name" "$output_path" "failed" "download_error"
        fi
    done

    manifest_array='[]'
    if [[ -s "$manifest_lines_file" ]]; then
        manifest_array="$(jq -s '.' "$manifest_lines_file")"
    fi

    manifest_file="$source_dir/manifest.json"
    jq -n \
        --arg source_repo "$source_repo" \
        --arg display_name "$source_display_name" \
        --arg generated_at "$GENERATED_AT" \
        --argjson roms "$manifest_array" \
        '{
            source_repo: $source_repo,
            display_name: $display_name,
            generated_at: $generated_at,
            roms: $roms
        }' > "$manifest_file"

    jq -n \
        --arg source_repo "$source_repo" \
        --arg display_name "$source_display_name" \
        --arg manifest "$manifest_file" \
        '{source_repo: $source_repo, display_name: $display_name, manifest: $manifest}' >> "$source_lines_file"
done

source_array='[]'
if [[ -s "$source_lines_file" ]]; then
    source_array="$(jq -s '.' "$source_lines_file")"
fi

mkdir -p "$OUTPUT_ROOT"
jq -n \
    --arg generated_at "$GENERATED_AT" \
    --argjson sources "$source_array" \
    '{generated_at: $generated_at, sources: $sources}' > "$OUTPUT_ROOT/index.json"

report_array='[]'
if [[ -s "$report_lines_file" ]]; then
    report_array="$(jq -s '.' "$report_lines_file")"
fi

jq -n \
    --arg generated_at "$GENERATED_AT" \
    --argjson items "$report_array" \
    '{
        generated_at: $generated_at,
        summary: {
            total: ($items | length),
            success: ([$items[] | select(.status == "success")] | length),
            failed: ([$items[] | select(.status == "failed")] | length)
        },
        items: $items
    }' > "$REPORT_FILE"

failed_count="$(jq -r '.summary.failed' "$REPORT_FILE")"

echo "Generated: $OUTPUT_ROOT/index.json"
echo "Generated: $REPORT_FILE"
echo "Summary: failed=${failed_count}"

if [[ "$FAIL_ON_ERROR" == "1" && "$failed_count" -gt 0 ]]; then
    exit 1
fi

