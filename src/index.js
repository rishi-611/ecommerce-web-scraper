import Puppeteer from "puppeteer";
import colors from "colors";
// import devices from "./data/devices.json" assert { type: "json" };

// const device = devices[0];

const start = async () => {
  const browser = await Puppeteer.launch({
    headless: false, //set true when not testing
  });
  try {
    const page = await browser.newPage();
    await page.goto("https://www.croma.com/");

    const laptopsListing = await page.$$eval(
      ".swiper-slide .slide-img-wrap a",
      (categories) => {
        console.log(categories);
        const final = categories.filter((category) => {
          return (
            category.querySelector("span > img")?.alt?.toLowerCase() ===
            "laptops"
          );
        });

        if (!final?.length)
          throw new Error({
            message: "type: laptops not found on home page",
          });
        return final[0].href;
      }
    );

    page.goto(laptopsListing, {
      waitUntil: "networkidle2",
    });

    // await browser.close();
  } catch (error) {
    // await browser.close();
    throw new Error(error);
  }
};

start()
  .then(() => {
    console.log("scrapped website successfully".green.bold);
  })
  .catch((err) => {
    console.log(err.message.red);
  });
