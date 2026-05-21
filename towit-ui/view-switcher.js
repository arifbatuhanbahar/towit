(function () {
  var KEY = "preferred_ui";
  var MOBILE_PATH = "/mobile/Towit.html?live=1";
  var DESKTOP_PATH = "/web/Towit%20Web.html";

  function isProbablyMobile() {
    var ua = navigator.userAgent || "";
    var mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    var narrowScreen = window.matchMedia && window.matchMedia("(max-width: 820px)").matches;
    return mobileUA || narrowScreen;
  }

  function pathFor(view) {
    return view === "mobile" ? MOBILE_PATH : DESKTOP_PATH;
  }

  function getPreferredView() {
    try {
      var value = localStorage.getItem(KEY);
      return value === "mobile" || value === "desktop" ? value : null;
    } catch {
      return null;
    }
  }

  function setPreferredView(view) {
    try {
      localStorage.setItem(KEY, view);
    } catch {}
  }

  function redirectToPreferredOrDetected() {
    var preferred = getPreferredView();
    var targetView = preferred || (isProbablyMobile() ? "mobile" : "desktop");
    window.location.replace(pathFor(targetView));
  }

  function mountSwitchButton(currentView) {
    var targetView = currentView === "mobile" ? "desktop" : "mobile";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = targetView === "desktop" ? "Web surume gec" : "Mobil surume gec";
    btn.style.position = "fixed";
    btn.style.right = "14px";
    btn.style.bottom = "14px";
    btn.style.zIndex = "9999";
    btn.style.border = "1px solid rgba(255,255,255,0.2)";
    btn.style.background = "rgba(0,0,0,0.75)";
    btn.style.color = "#fff";
    btn.style.borderRadius = "999px";
    btn.style.padding = "9px 13px";
    btn.style.fontSize = "12px";
    btn.style.fontWeight = "700";
    btn.style.cursor = "pointer";
    btn.style.backdropFilter = "blur(6px)";

    btn.addEventListener("click", function () {
      setPreferredView(targetView);
      window.location.href = pathFor(targetView);
    });

    document.body.appendChild(btn);
  }

  window.TowitViewSwitcher = {
    redirectToPreferredOrDetected: redirectToPreferredOrDetected,
    mountSwitchButton: mountSwitchButton,
    setPreferredView: setPreferredView,
    getPreferredView: getPreferredView,
  };
})();
