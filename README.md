# FCGame - FC/NES 模拟器

- 基于 JSNES 二次开发的前端静态 FC/NES 模拟器。
- 项目代码持续开源，内置少量“合规白名单 Homebrew ROM”，不内置商业 ROM。

## FC 模拟器网页效果图

### 横屏效果
![横屏预览](/static/landscape_mode.png)

### 竖屏效果
![竖屏预览](/static/portrait_mode.png)

## 按键说明

移动端使用触摸操控，PC 端按键映射如下：

| 按键     | player1 | player2 |
|:-------|:--------|:--------|
| Up     | W       | ↑       |
| Down   | S       | ↓       |
| Left   | A       | ←       |
| Right  | D       | →       |
| B      | K       | Num2    |
| A      | J       | Num1    |
| Select | Space   | Num/    |
| Start  | Enter   | Num*    |

说明：`player2` 的 `Num1` / `Num2` / `Num*` / `Num/` 依赖数字小键盘，部分笔记本无独立小键盘；使用前请确认键盘支持并开启 `NumLock`。

## Docker 部署

在仓库根目录执行以下命令即可本地运行：

```bash
docker build -t fcgame:local .
docker run --rm -p 8080:80 fcgame:local
```

浏览器访问：`http://localhost:8080`

## 本地导入 ROM

1. 启动页面后，在游戏区域上方点击文件选择框。
2. 选择本地 `.nes` 文件。
3. 状态栏出现“本地 ROM 已加载”后即可开始游戏。

说明：当前仓库提供“合规白名单”内置 ROM，同时支持本地导入你合法持有的其他 ROM。

## 内置白名单 ROM（Homebrew）

来源仓库分组：`nes-open-db/nes-open-db`（本地目录：`roms/nes-open-db/`）

- `kubo.nes`（CC BY 4.0）
- `megamountain.nes`（CC BY-SA 4.0）
- `melojellos2.nes`（CC BY-SA 4.0）
- `nesert-golfing.nes`（CC BY 4.0）
- `robo-ninja-climb.nes`（CC BY-NC-ND 3.0）
- `spacey-mcracey.nes`（CC BY-NC-ND 3.0）
- `super-homebrew-war.nes`（CC BY-NC-ND 3.0）

其中 NC/ND 条款 ROM 存在“非商业、禁止演绎”限制，使用前请先核对 `roms/WHITELIST.md` 与 `roms/licenses/`。

## 合规声明

- 本仓库 **不内置和分发商业游戏 ROM**。
- ROM 著作权归原权利人所有，开源协议不覆盖第三方 ROM 版权。
- 仅建议使用你已获得授权、可合法持有和使用的 ROM。
- 当前内置白名单见 `roms/WHITELIST.md`，每个 ROM 的许可证文本见 `roms/licenses/`。

## 开源协议

- 代码协议：`GPL-3.0-or-later`
- 详见仓库根目录 `LICENSE`。

## 赞助

[谢谢打赏 🙏](https://github.com/lucaschungzsj/fcgame/blob/main/SPONSOR.md) — **没准儿我也能吃上带鸡蛋的豪华泡面了 🥚**

## Star History

[![Star History Chart](https://api.star-history.com/image?repos=lucaszhongsj/fcgame&type=date&legend=top-left)](https://www.star-history.com/?repos=lucaszhongsj%2Ffcgame&type=date&legend=top-left)
