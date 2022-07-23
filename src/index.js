import Puppeteer from "puppeteer";
import colors from "colors";
import currency from "currency.js";

const device = {
  type: "laptops",
  brand: "apple",
  model: "macbook pro",
  processor: "m1",
  ram: "8gb",
  ssd: "512gb",
  os: "macOS",
};

const getPrice = async (device, websiteURL) => {
  const browser = await Puppeteer.launch({
    headless: false, //set true when not testing
  });
  try {
    //open page and goto website
    const page = await browser.newPage();
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
    // await browser.close();
    throw new Error(error);
  }
};

getPrice(device, "https://www.croma.com/")
  .then((laptops) => {
    console.log("scrapped website successfully".green.bold);
    console.log(laptops);
  })
  .catch((err) => {
    console.log(err.message.red);
  });
