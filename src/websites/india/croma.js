import Puppeteer from "puppeteer";
import colors from "colors";
import currency from "currency.js";

const websiteURL = "https://www.croma.com/";

export const scrapeCroma = async (device) => {
  const browser = await Puppeteer.launch({
    headless: false, //set true when not testing
  });
  try {
    console.log(
      `device: ${device.type} ${device.brand} ${device.model} ${device.processor}`
    );
    //open page and goto website
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36"
    );

    await page.goto(websiteURL);
    await page.waitForNetworkIdle();

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

          if (!title) return null;

          return (
            title.includes(device.brand.toLowerCase()) &&
            title.includes(device.model.toLowerCase()) &&
            title.includes(device.processor.toLowerCase()) &&
            title.includes(device.ram.toLowerCase() + " ram") &&
            title.includes(device.ssd.toLowerCase() + " ssd") &&
            title.includes(device.os.toLowerCase())
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
