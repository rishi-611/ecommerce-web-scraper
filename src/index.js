import colors from "colors";
import currency from "currency.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import csv from "csvtojson";
import { Parser } from "json2csv";
import { updateDevices } from "./utils/index.js";
import { scrapeCroma } from "./websites/india/croma.js";
import { scrapeJohnLewis } from "./websites/uk/johnlewis.js";
import { scrapeCurrys } from "./websites/uk/currys.js";

const init = async () => {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const devicesFilePath = path.join(dir, "\\data", "\\devices.csv");

  //parse the devices json file
  let devices = await csv().fromFile(devicesFilePath);

  console.log("fetched previous devices list".blue);

  //scrape croma website for each device, and update device info
  let priceList = await scrapeCurrys(devices);
  updateDevices(devices, priceList);
  console.log("updated devices.csv".green);

  // //scrape croma website for each device, and update device info
  // let priceList = await scrapeCroma(devices);
  // updateDevices(devices, priceList);
  // console.log("updated devices.csv".green);

  // //scrape johnlewis
  // priceList = await scrapeJohnLewis(devices);
  // updateDevices(devices, priceList);
  // console.log("updated devices.csv".green);

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
