import Puppeteer from "puppeteer";
import colors from "colors";
// import devices from "./data/devices.json" assert { type: "json" };

// const device = devices[0];

const device = {
  type: "laptops",
  brand: "apple",
  model: "macbook pro",
  processor: "m1",
  ram: "8gb",
  ssd: "512gb",
  os: "macOS",
};

const start = async () => {
  const browser = await Puppeteer.launch({
    headless: false, //set true when not testing
  });
  try {
    const page = await browser.newPage();
    await page.goto("https://www.croma.com/");

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

    const laptops = await page.$$eval(
      ".product-title > a",
      (laptops, device) => {
        laptops = laptops.filter((laptop) => {
          const text = laptop.textContent.toLowerCase();
          console.log(text);
          console.log(
            device.brand,
            device.model,
            device.processor,
            text.includes(device.brand) &&
              text.includes(device.model) &&
              text.includes(device.processor) &&
              text.includes(device.ram + " ram") &&
              text.includes(device.ssd + " ssd")
          );

          return (
            text.includes(device.brand) &&
            text.includes(device.model) &&
            text.includes(device.processor) &&
            text.includes(device.ram + " ram") &&
            text.includes(device.ssd + " ssd")
          );
        });

        return laptops.map((laptop) => laptop.textContent.toLowerCase());
      },
      device
    );

    console.log(laptops);

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
