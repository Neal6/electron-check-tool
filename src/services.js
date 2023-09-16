const puppeteer = require("puppeteer-extra");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const checkAsin = async (params) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
  });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
  );

  await page.goto(`https://www.amazon.com/`, {
    waitUntil: "domcontentloaded",
  });
  try {
    await page.waitForTimeout(20000);
    let stopReload = 0;
    while (stopReload === 0) {
      let isNotHomePage = await page.evaluate(() => {
        if (document.getElementById("captchacharacters")) {
          return true;
        } else if (
          !document.getElementById("nav-global-location-popover-link")
        ) {
          return true;
        } else {
          return false;
        }
      });
      if (!isNotHomePage) {
        stopReload = 1;
      } else {
        await page.waitForTimeout(5000);
        await page.goto(`https://www.amazon.com/`, {
          waitUntil: "domcontentloaded",
        });
      }
    }

    await page.waitForTimeout(2000);
    await page.click("#nav-global-location-popover-link");
    await page.waitForTimeout(2000);
    await page.type("#GLUXZipUpdateInput", "90017");
    await page.waitForTimeout(2000);
    await page.click("#GLUXZipUpdate-announce");
    await page.waitForTimeout(2000);
    await page.goto(`https://www.amazon.com/`, {
      waitUntil: "domcontentloaded",
    });

    for (let index = 0; index < params.length; index++) {
      const element = params[index];
      if (element.asin) {
        await page.waitForTimeout(1000);
        await page.click("#twotabsearchtextbox", { clickCount: 2 });
        await page.waitForTimeout(500);
        await page.type("#twotabsearchtextbox", element.asin);
        await page.waitForTimeout(500);
        await page.click("#nav-search-submit-button");
        await page.waitForNavigation();
        const isNoResult = await page.evaluate(() => {
          if (
            document.getElementsByClassName(
              "widgetId=messaging-messages-no-results"
            )?.length > 0
          ) {
            return true;
          } else {
            return false;
          }
        });
        if (!isNoResult) {
          await page.evaluate((element) => {
            document.querySelector(`div[data-asin=${element.asin}] a`).click();
            return;
          }, element);

          await page.waitForNavigation();
          const checkList = await page.evaluate(() => {
            let list = [];
            if (
              document.querySelector("[data-action='show-all-offers-display']")
            ) {
              list.push("offfers");
            } else {
              list.push("noOffers");
            }
            if (!document.querySelector("#twister_feature_div li")) {
              list.push("noOptions");
            } else {
              const listOption = document.querySelectorAll(
                "#twister_feature_div ul.a-button-list"
              );
              let validOptions = false;
              listOption.forEach((opt) => {
                if (
                  opt.querySelectorAll("li:not(.swatch-prototype)").length > 1
                ) {
                  validOptions = true;
                }
              });
              console.log(validOptions);
              if (validOptions) {
                list.push("options");
              } else {
                list.push("noOptions");
              }
            }
            if (!document.getElementById("buy-now-button")) {
              list.push("noBuyBox");
            } else {
              list.push("buybox");
            }
            return list;
          });
          checkList.push("result");
          params[index].checkResult = checkList;
        } else {
          params[index].checkResult = ["noResult"];
        }
      }
    }
    await browser.close();

    return params;
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

module.exports = {
  checkAsin,
};
