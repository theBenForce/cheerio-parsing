import cheerio from "cheerio";
import axios from "axios";
import json2csv from "json2csv";
import * as fsp from "fs/promises";

const getPopulationData = async (): Promise<Array<any>> => {
	const targetUrl = "https://en.wikipedia.org/wiki/List_of_countries_and_dependencies_by_population";
	const pageResponse = await axios.get(targetUrl);

  const keys = [];
  const result = [];

  const $ = cheerio.load(pageResponse.data);

  $("table.wikitable")
  .find("tr")
  .each((row, elem) => {
    if(row === 0) {
      $(elem).find('th').each((idx, elem) => {
          const key = $(elem).text().trim();
          
          console.info(`Key ${idx}`, key);
          keys.push(key);
      });
      return;
    }

    const nextCountry = {};
    $(elem).find('td,th').each((idx, elem) => {
        const value = $(elem).text().trim();
        const key = keys[idx];

        nextCountry[key] = value;
    });
    result.push(nextCountry);
  });

  return result;
};

const saveCsv = async (countries: Array<any>) => {
  console.info(`Saving ${countries.length} records`);

  const j2cp = new json2csv.Parser();
  const csv = j2cp.parse(countries);

  await fsp.writeFile("./output.csv", csv, { encoding: "utf-8" });
};

getPopulationData().then(saveCsv);