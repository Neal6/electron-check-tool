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

    const page2 = await browser.newPage();
    await page2.setViewport({
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
    });
    const page3 = await browser.newPage();
    await page3.setViewport({
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
    });
    const page4 = await browser.newPage();
    await page4.setViewport({
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
    });
    const page5 = await browser.newPage();
    await page5.setViewport({
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
    });

    const subParams = [[], [], [], [], []];
    let i = 0;
    for (let index = 0; index < params.length; index++) {
      const element = params[index];
      subParams[i].push(element);
      i++;
      if (i > 4) {
        i = 0;
      }
    }
    console.log(subParams)

    await Promise.all([
      page2.goto(`https://www.amazon.com/`, {
        waitUntil: "domcontentloaded",
      }),
      page3.goto(`https://www.amazon.com/`, {
        waitUntil: "domcontentloaded",
      }),
      page4.goto(`https://www.amazon.com/`, {
        waitUntil: "domcontentloaded",
      }),
      page5.goto(`https://www.amazon.com/`, {
        waitUntil: "domcontentloaded",
      }),
    ]);

    await Promise.all([
      checkToolLogic(params, subParams[0], page),
      checkToolLogic(params, subParams[1], page2),
      checkToolLogic(params, subParams[2], page3),
      checkToolLogic(params, subParams[3], page4),
      checkToolLogic(params, subParams[4], page5),
    ]);
    await browser.close();

    return params;
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

async function checkToolLogic(params, asinList, page) {
  for (let index = 0; index < asinList.length; index++) {
    const element = asinList[index];
    const indexInParams = params.findIndex((p) => p.asin === element.asin);
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
          document.querySelector(`div[data-asin=${element.asin}] img`).click();
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
        params[indexInParams].checkResult = checkList;
      } else {
        params[indexInParams].checkResult = ["noResult"];
      }
    }
  }
}

module.exports = {
  checkAsin,
};
