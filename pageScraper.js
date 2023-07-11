const ocrApiKey = "K89747904988957";

const getOCRCode = async (imageSrc) => {
  return await fetch(
    `https://api.ocr.space/parse/imageurl?apikey=${ocrApiKey}&url=${imageSrc}`,
  )
    .then((res) => res.json())
    .then((data) => {
      const parsedText = data?.ParsedResults?.[0]?.ParsedText || "";
      const code = parsedText.split("\r\n")?.[1];
      const codeWithO = "O" + code.substring(1);
      console.log(
        "OCR processing time > ",
        data?.ProcessingTimeInMilliseconds,
        "new code > ",
        codeWithO,
      );
      return codeWithO;
    });
};

const inputOCRCodeRecursively = async (imageSrc) => {
  await getOCRCode(imageSrc)
    .then((coupon_code) => {
      fetch(
        "https://api2.electriccastle.ro/api/rest/redeem-access/aZBOyAFgF2dr7Q==",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coupon_code,
            ticket_address: "Str. Brandusa, Bl. G33, ap. 14|Satu Mare|Romanian",
            ticket_name: "Lung Andreea-Cristina",
          }),
        },
      )
        .then((res) => res.json())
        .then((redeemAccessCallResponse) => {
          console.log(
            "Redeem Access call successful >",
            redeemAccessCallResponse,
          );
        })
        .catch((e) => {
          console.log("Redeem Access call failed >", e);
        });
    })
    .catch((errorOcrCall) => {
      console.log("OCR call failed >", errorOcrCall);
      inputOCRCodeRecursively(imageSrc);
    });
};

const scraperObject = {
  url: "https://electriccastle.ro/bontidafever",
  async scraper(browser) {
    let page = await browser.newPage();
    page.setCookie({
      name: "AUTH_TOKEN",
      value: "nGBJLY0fFePFGA%3D%3D",
      domain: "electriccastle.ro",
    });
    console.log(`Navigating to ${this.url}...`);
    await page.goto(this.url);
    async function searchForImageCode() {
      try {
        const imageSrc = await page.$eval(
          'img[alt="EC free pass"]',
          (img) => img.src,
        );
        if (imageSrc.contains("ticket_gone")) {
          throw new Error("Ticket gone image");
        }

        console.log("Found image", imageSrc);

        //logic after finding image code
        await inputOCRCodeRecursively(imageSrc);

        await page.close();
        await browser.close();
      } catch (err) {
        console.log("No code yet. Reloading...");
        await page.reload({ timeout: 0 });
        await searchForImageCode();
      }
    }
    await searchForImageCode();
  },
};

module.exports = scraperObject;
