import Puppeteer from "puppeteer";
import colors from "colors";

const start = async () => {
  const browser = await Puppeteer.launch({
    headless: false, //set true when not testing
  });
  const page = await browser.newPage();
  await page.goto("https://www.reliancedigital.in");

  await browser.close;
};

start()
  .then(() => {
    console.log("scrapped website successfully".green.bold);
  })
  .catch((err) => {
    console.log(err.message.red);
  });
