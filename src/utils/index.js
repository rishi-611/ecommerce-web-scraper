import currency from "currency.js";

export const updateDevices = (devices, priceList) => {
  for (let i = 0; i < devices.length; i++) {
    const priceData = priceList[i];
    if (!priceData) {
      continue;
    }
    devices[i] = {
      ...devices[i],
      updatedAt: priceData.updatedAt,
      price: currency(priceData.minPrice, {
        symbol: priceData.currency,
      }).format(),
      url: priceData.productURL,
    };
  }

  return;
};
