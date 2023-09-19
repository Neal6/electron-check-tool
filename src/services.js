const puppeteer = require("puppeteer-extra");

const StealthPlugin = require("puppeteer-extra-plugin-stealth");

const { executablePath } = require("puppeteer");

puppeteer.use(StealthPlugin());

const checkAsin = async (params) => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    executablePath: executablePath(),
  });
  let page1 = await browser.newPage();
  await page1.setViewport({
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
  });
  await page1.goto(`https://www.amazon.com/`, {
    waitUntil: "domcontentloaded",
  });

  try {
    let stopReload = 0;
    while (stopReload === 0) {
      await page1.waitForTimeout(1000);
      let isNotHomePage = await page1.evaluate(() => {
        if (document.getElementById("captchacharacters")) {
          return true;
        } else if (
          !document.getElementById("nav-global-location-popover-link")
        ) {
          return "reload";
        } else {
          return false;
        }
      });
      if (!isNotHomePage) {
        stopReload = 1;
      } else if (isNotHomePage === "reload") {
        await page1.goto(`https://www.amazon.com/`, {
          waitUntil: "domcontentloaded",
        });
      }
    }
    await page1.waitForTimeout(2000);
    await page1.click("#nav-global-location-popover-link");
    await page1.waitForTimeout(2000);
    await page1.type("#GLUXZipUpdateInput", "90017");
    await page1.waitForTimeout(2000);
    await page1.click("#GLUXZipUpdate-announce");
    await page1.waitForTimeout(2000);
    await page1.goto(`https://www.amazon.com/`, {
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
    console.log(subParams);

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
      checkToolLogic(params, subParams[0], page1),
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
      await page.waitForSelector("#twotabsearchtextbox");
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
        const checkResult = await page.evaluate((element) => {
          if (document.querySelector(`div[data-asin=${element.asin}]`)) {
            document
              .querySelector(`div[data-asin=${element.asin}] img`)
              .click();
            return true;
          } else {
            return false;
          }
        }, element);
        if (!checkResult) {
          params[indexInParams].checkResult = ["noResult"];
          continue;
        }
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
