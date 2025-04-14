
  (function () {
    fetch("https://power-dk-case-conversio.myshopify.com/apps/proxytest1", {
      method: "GET",
      headers: {
        "Content-Type": "application/javascript",
        "X-Custom-Header": "ShopifyApp"
      }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load script");
        }
        return res.text();
      })
      .then((scriptText) => {
        // Inject the script directly into <head> without using createElement
        document.head.insertAdjacentHTML("beforeend", `${scriptText}`);
      })
      .catch((err) => {
        console.error("Script fetch error:", err);
      });
  })();
