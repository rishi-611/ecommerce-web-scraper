import Puppeteer from "puppeteer";
import colors from "colors";
import currency from "currency.js";

const websiteURL = "https://www.johnlewis.com/";
const country = "UK";

export const scrape = async (websiteURL, device) => {
  try {
    console.log(
      `searching for device: ${device.type} ${device.brand} ${device.model} ${device.processor}`
    );
    const browser = await Puppeteer.launch({
      headless: false, //set true when not testing
    });
    //open page and goto website
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36"
    );

    await page.goto(websiteURL);
    await page.waitForNetworkIdle();

    const $searchInput = "#mobileSearch";
    const $productTile = ".product-card_c-product-card__UAdsG";
    const $productTitle = `${$productTile} > a`;
    const $productPrice = `${$productTile} > div:second-child`;
    const $productUrl = `${$productTile} > a`;

    //enter product keywords in searchbar, and goto listing page
    const searchText =
      device.type +
      " " +
      device.brand +
      " " +
      device.model +
      " " +
      device.processor;

    await page.type($searchInput, searchText);
    await Promise.all([
      page.keyboard.press("Enter"),
      page.waitForNetworkIdle(),
    ]);

    //filter products for which all device specs match, get their price and url
    const laptops = await page.$$eval(
      $productTile,
      (products, device) => {
        products = products.filter((product) => {
          const title = product
            .querySelector($productTitle)
            ?.textContent?.toLowerCase();

          if (!title) return null;

          return (
            title.includes(device.brand.toLowerCase()) &&
            title.includes(device.model.toLowerCase()) &&
            title.includes(device.processor.toLowerCase()) &&
            title.includes(device.ram.toLowerCase() + " ram") &&
            title.includes(device.ssd.toLowerCase() + " ssd")
          );
        });

        //for the the filtered products, return their price details
        return products.map((product) => ({
          price: product.querySelector($productPrice)?.textContent,
          productURL: product.querySelector($productUrl)?.href,
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
            country,
            updatedAt: dayjs(new Date()).format("DD MMM YYYY"),
          };
        }

        return res;
      },
      {
        minPrice: Infinity,
        currency: null,
        productURL: null,
        updatedAt: dayjs(new Date()).format("DD MMM YYYY"),
      }
    );
  } catch (error) {
    await browser.close();
    throw new Error(error);
  }
};

export const scrapeJohnLewis = async (devices) => {
  try {
    console.log(("scraping " + websiteURL).blue);
    const priceList = [];
    //for every device, scrape the website serially, and return the updated list,
    for (let i = 0; i < devices.length; i++) {
      console.log(devices[i]);
      priceList[i] = await scrape(websiteURL, devices[i]);
      console.log(
        priceList[i] ? "device found".green : "device not found".yellow
      );
    }
    return priceList;
  } catch (error) {
    throw new Error(error);
  }
};
