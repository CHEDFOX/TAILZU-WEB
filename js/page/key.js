// The key ("Take me home", to whatever this device installs) and the name: they arrive after the wave.
import { reduced } from "../util.js";

let mastOn = false;
const mast = document.getElementById("mast"), homeA = document.getElementById("home");
const spot = document.getElementById("spot");
// After the wave: the page goes soft, the button appears big in the middle,
// holds, then flies to its place in the mast as the page comes back; the
// name follows. `quick`: without the pause (the visitor has already moved on).
export function revealKey(quick) {
  mastOn = true;
  mast.classList.add("show");
  if (reduced) { mast.classList.add("named"); return; }
  // The visitor moved on before the wave was over: no pause for it, it just comes in with the name.
  if (quick) {
    homeA.animate([{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: "cubic-bezier(.2, .9, .3, 1)" });
    mast.classList.add("named");
    return;
  }
  // Right where it lives: everything else goes soft, the key alone is
  // sharp and lit; then the page comes back and the name follows.
  spot.classList.add("on"); mast.classList.add("lit");
  homeA.animate([
    { opacity: 0, transform: "translateY(-8px) scale(.9)" },
    { opacity: 1, transform: "translateY(0) scale(1.07)", offset: .55 },
    { opacity: 1, transform: "none" },
  ], { duration: 720, easing: "cubic-bezier(.2, .9, .3, 1.2)" });
  setTimeout(() => { if (!mastOn) return; spot.classList.remove("on"); mast.classList.remove("lit"); }, 1500);
  setTimeout(() => { if (!mastOn) return; mast.classList.add("named"); }, 1650);
}
if (!reduced && matchMedia("(hover: hover)").matches) {
  homeA.addEventListener("pointermove", (e) => {
    const r = homeA.getBoundingClientRect();
    homeA.style.setProperty("--mx", (((e.clientX - r.left) / r.width - .5) * 8).toFixed(1) + "px");
    homeA.style.setProperty("--my", (((e.clientY - r.top) / r.height - .5) * 6).toFixed(1) + "px");
  });
  homeA.addEventListener("pointerleave", () => { homeA.style.setProperty("--mx", "0px"); homeA.style.setProperty("--my", "0px"); });
}
// The button knows the visitor (the live site's detect()/hrefFor(); the
// links are /v1/site's stores and downloads as served today).
(function homeLink() {
  const ua = navigator.userAgent || "";
  const os = /iPhone|iPod|iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "ios"
    : /Android/.test(ua) ? "android" : /CrOS/.test(ua) ? "chromeos" : /Windows/.test(ua) ? "win" : /Mac OS X|Macintosh/.test(ua) ? "mac" : /Linux/.test(ua) ? "linux" : "other";
  const DL = "https://api.x0bot.com/downloads/";
  const HREF = { ios: "https://apps.apple.com/app/id6784811357", android: "https://play.google.com/store/apps/details?id=com.tulmi.app", win: "https://get.microsoft.com/installer/download/9N3GX0XHQ7MX?referrer=appbadge&source=x0bot.com", mac: DL + "Tailzu.dmg", linux: DL + "Tailzu.AppImage" };
  const NAME = { ios: "iPhone", android: "Android", win: "Windows", mac: "Mac", linux: "Linux" };
  homeA.href = HREF[os] || "/download";
  document.getElementById("homeOs").textContent = NAME[os] ? `X0 Bot for ${NAME[os]}` : "Get X0 Bot";
  homeA.dataset.os = os;
  homeA.setAttribute("aria-label", NAME[os] ? `Take me home: get X0 Bot for ${NAME[os]}` : "Take me home: get X0 Bot");
})();
/** Back to before the wave (the opening plays again after a resize mid-walk). */
export function hideKey() {
  mastOn = false;
  mast.classList.remove("show", "named", "lit"); spot.classList.remove("on");
  homeA.getAnimations().forEach((a) => a.cancel());
}
/** Its moment cut short (the page moves on): the page comes back sharp at once, the name in place. */
export function settleKey() {
  if (!mastOn) return;
  spot.classList.remove("on"); mast.classList.remove("lit"); mast.classList.add("named");
}
/** True once the key has started to arrive. */
export const keyShown = () => mastOn;
