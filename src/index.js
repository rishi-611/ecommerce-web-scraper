import colors from "colors";
import currency from "currency.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import csv from "csvtojson";
import { Parser } from "json2csv";
import { scrapeCroma } from "./websites/india/croma.js";

const init = async () => {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const devicesFilePath = path.join(dir, "\\data", "\\devices.csv");

  //parse the devices json file
  let devices = await csv().fromFile(devicesFilePath);

  console.log("fetched previous devices list".blue);

  //scrape website for each device, and update device info
  for (let i = 0; i < devices.length; i++) {
    const priceData = await scrapeCroma(devices[i]);
    if (!priceData) {
      console.log("no available products for this device".yellow);
      devices[i].price = null;
      devices[i].url = null;
      continue;
    }
    console.log("price list updated for this device".blue);
    devices[i] = {
      ...devices[i],
      price: currency(priceData.minPrice, {
        symbol: priceData.currency,
      }).format(),
      url: priceData.productURL,
    };
  }

  //convert json to csv, and overwrite existing file
  const parser = new Parser();
  const csvFile = parser.parse(devices);

  await fs.writeFile(devicesFilePath, csvFile);
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
