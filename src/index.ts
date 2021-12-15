import cheerio from "cheerio";
import axios from "axios";
import json2csv from "json2csv";
import * as fsp from "fs/promises";
import * as fs from "fs";
import * as path from "path";

const downloadData = async (): Promise<string> => {
	const targetUrl = "https://en.wikipedia.org/wiki/List_of_countries_and_dependencies_by_population";
  const tempPath = path.resolve("./country_data.tmp.html");

  const cacheExists = fs.existsSync(tempPath);

  if (!cacheExists) {
    console.info(`Downloading ${targetUrl}`);
    const response = await axios.get(targetUrl);
    await fsp.writeFile(tempPath, response.data, { encoding: "utf-8" });
    return response.data;
  }

  console.info(`Using cache`);
  return fsp.readFile(tempPath, { encoding: "utf-8" });
}

const getPopulationData = async (content: string): Promise<Array<any>> => {
  const keys = [];
  const result = [];

  const $ = cheerio.load(content);

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

downloadData()
  .then(getPopulationData)
  .then(saveCsv);