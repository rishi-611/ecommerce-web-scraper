import Puppeteer from "puppeteer";
import colors from "colors";
import currency from "currency.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const websiteURL = "https://www.croma.com/";

const getPrice = async (device, websiteURL) => {
  const browser = await Puppeteer.launch({
    headless: false, //set true when not testing
  });
  try {
    //open page and goto website
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36"
    );

    await page.goto(websiteURL);

    //enter product keywords in searchbar, and goto listing page
    const searchText =
      device.type +
      " " +
      device.brand +
      " " +
      device.model +
      " " +
      device.processor;
    await page.type("#search", searchText);
    await Promise.all([
      page.keyboard.press("Enter"),
      page.waitForNetworkIdle(),
    ]);

    //filter products for which all device specs match, get their price and url
    const laptops = await page.$$eval(
      ".product-info",
      (products, device) => {
        products = products.filter((product) => {
          const title = product
            .querySelector(".product-title > a")
            ?.textContent?.toLowerCase();

          return (
            title.includes(device.brand) &&
            title.includes(device.model) &&
            title.includes(device.processor) &&
            title.includes(device.ram + " ram") &&
            title.includes(device.ssd + " ssd")
          );
        });

        return products.map((product) => ({
          price: product.querySelector(".amount")?.textContent,
          productURL: product.querySelector(".product-title > a")?.href,
        }));
      },
      device
    );

    //close the browser
    await browser.close();

    //return the laptop which has minimum price
    if (!laptops.length) return null;

    return laptops.reduce(
      (res, laptop) => {
        const price = currency(laptop.price);

        const amount = price.value;

        if (amount < res.minPrice) {
          res = {
            minPrice: amount,
            currency: laptop.price[0],
            productURL: laptop.productURL,
          };
        }

        return res;
      },
      {
        minPrice: Infinity,
        currency: null,
        productURL: null,
      }
    );
  } catch (error) {
    await browser.close();
    throw new Error(error);
  }
};

const init = async () => {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const devicesFilePath = path.join(dir, "\\data", "\\devices.json");

  //parse the devices json file
  let devices = JSON.parse(await fs.readFile(devicesFilePath));

  //scrape for prices for each device
  devices = await Promise.all(
    devices.map(async (device) => {
      const priceData = await getPrice(device, websiteURL);
      return {
        ...device,
        price: currency(priceData.minPrice, {
          symbol: priceData.currency,
        }).format(),
        url: priceData.productURL,
      };
    })
  );

  //rewrite to devices file, and prettify the json file with indentations
  await fs.writeFile(devicesFilePath, JSON.stringify(devices, null, 2));
};

init()
  .then(() => {
    console.log("web scrapping done".green.bold);
  })
  .catch((err) => {
    console.error(err);
  })
  .finally(() => {
    process.exit();
  });
