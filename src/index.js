import translate from "google-translate-api";
import audio from "./pujas/audio/audio.js";
process.env["NTBA_FIX_350"] = 1;
//const TelegramBot = require("node-telegram-bot-api");
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import { obj } from "./endurance.js";
import axios, { all } from "axios";
import fs from "fs";
import { parse } from "path";
import allDhp from "./dhpjson/allDhp.js";
import fetch from "node-fetch";
import allChantings from "./pujas/text/puja.js";
import { send } from "process";
//import indexDhp from "./dhpjson/dhammapada.js";
import paliDhp from "./dhpjson/allDhpPali.js";
import dhp_thanissaro from "./dhpjson/text/translation_thanissaro.js";
import dhp_buddharakkhita from "./dhpjson/text/translation_buddharakkhita.js";

//createJsonWithAllDhp();
//ler files
//copiar no file

//const obj = require("./endurance");
//require("dotenv").config();
dotenv.config();

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(process.env.TOKEN, { polling: true });

bot.request = async function (command, json) {
  return fetch(`https://api.telegram.org/bot${token}/${command}`, {
    method: "post",
    body: JSON.stringify(json),
    headers: { "Content-Type": "application/json" },
  });
};

bot.request("setMyCommands", {
  commands: [
    {
      command: "Command 1",
      description: "Command 1 Description.",
    },
    {
      command: "Command 2",
      description: "Command 2 Description.",
    },
  ],
  scope: { type: "all_private_chats" }, // This is adding commands for Private Message with Bot. Find Scopes on API.
  language_code: "en", // Language; en = English.
});
// function sendDhammapada() {
//   console.log("aqui");
//   console.log(cap1.Chapter.Verses.Verse[0].Paragraphs.Par.Txt);
// }
// sendDhammapada();
// Matches "/echo [whatever]"
function sendDhammapadasWithFetchedWord(chatId, dhpWithFetchedWord) {
  dhpWithFetchedWord
    ? bot.sendMessage(chatId, dhpWithFetchedWord)
    : bot.sendMessage(chatId, "there isnt");
}

function divideButtonsByLine(arrayWithTelegramButtons) {
  //divide in lines
  const numberButtons = arrayWithTelegramButtons.length;
  const lines = Math.floor(numberButtons / 3) + 1;
  let newArrayButtonsDividedByLines = [];
  let newSubArray = [];

  for (let i = 0; i < numberButtons; i++) {
    newSubArray = [];
    let cont = 0;
    while (cont < 3 && i < numberButtons) {
      newSubArray.push(arrayWithTelegramButtons[i]);
      i++;
      cont++;
    }
    if (newSubArray != []) {
      newArrayButtonsDividedByLines.push(newSubArray);
    }
  }

  newArrayButtonsDividedByLines.push(["/closeButtons"]);

  return newArrayButtonsDividedByLines;
}

function sendButtonsDhammapadasWithFetchedWord(
  chatId,
  arrayWithTelegramButtons
) {
  const newArrayButtonsDividedByLines = divideButtonsByLine(
    arrayWithTelegramButtons
  );

  //console.log(newArrayButtonsDividedByLines);

  arrayWithTelegramButtons
    ? bot.sendMessage(chatId, "Do you want to know a story about that ?", {
        reply_markup: {
          keyboard: newArrayButtonsDividedByLines,
        },
      })
    : bot.sendMessage(
        chatId,
        "If you want to search more words just put it /dhp wordFetched"
      );
}

bot.onText(/\/dhpsearch (.+)/, async (msg, keywordFetchedByUser) => {
  const chatId = msg.chat.id;
  const keywordFetched = keywordFetchedByUser[1]; // the captured "whatever"

  let dhpWithFetchedWord = "";
  let arrayWithTelegramButtons = [];

  for (let i = 0; i < allDhp.length; i++) {
    let numberOfVersesInChapter = allDhp[i]?.Chapter.Verses.Verse.length;

    for (let j = 0; j < numberOfVersesInChapter; j++) {
      let dhp_number = allDhp[i].Chapter.Verses.Verse[j]?.Paragraphs.Par.Nr;
      let dhp_verse = allDhp[i].Chapter.Verses.Verse[j]?.Paragraphs.Par.Txt;
      if (dhp_verse?.includes(keywordFetched)) {
        dhpWithFetchedWord = "";
        dhpWithFetchedWord += "\nDhp" + dhp_number + "\n" + dhp_verse + "\n\n";
        arrayWithTelegramButtons.push("/storyDhp " + dhp_number);
        await bot.sendMessage(chatId, dhpWithFetchedWord);
        //await bot.sendMessage(chatId, dhp_verse);
      }
    }
  }

  sendDhammapadasWithFetchedWord(chatId, dhpWithFetchedWord);
  sendButtonsDhammapadasWithFetchedWord(chatId, arrayWithTelegramButtons);
});

bot.onText(/\/storyDhp (.+)/, async (msg, dhpNumber) => {
  const chatId = msg.chat.id;
  const dhpNumberFetchedStory = dhpNumber[1]; // the captured "whatever"

  for (let i = 0; i < allDhp.length; i++) {
    let numberOfVersesInChapter = allDhp[i]?.Chapter.Verses.Verse.length;

    for (let j = 0; j < numberOfVersesInChapter; j++) {
      let dhp_numberToCompare =
        allDhp[i].Chapter.Verses.Verse[j]?.Paragraphs.Par.Nr;
      let dhp_verseCurrent = allDhp[i].Chapter.Verses.Verse[j]?.Story.Txt;
      if (dhpNumberFetchedStory === dhp_numberToCompare) {
        await bot.sendMessage(chatId, dhp_verseCurrent);
        bot.sendMessage(chatId, "Good Read!", {
          reply_markup: JSON.stringify({
            hide_keyboard: true,
          }),
        });
      }
    }
  }
});

bot.onText(/\/closeButtons/, async (msg, match) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Good Read!", {
    reply_markup: JSON.stringify({
      hide_keyboard: true,
    }),
  });
});

// function findChapterOfDhp(numberDhpFetched) {
//   let chapterNumber = -1;
//   for (let i = 0; i < indexDhp.length; i++) {
//     if (
//       numberDhpFetched >= indexDhp.Chapters[i].FirstParagraph ||
//       numberDhpFetched <= indexDhp.Chapters[i].LastParagraph
//     ) {
//       chapterNumber = i + 1;
//     }
//   }

//   return chapterNumber;
// }

// function findPaliDhp(chapterNumber){
//     for(let i = 0; i < allDhp.)
// }

bot.onText(/\/dhpt (.+)/, async (msg, numberDhp) => {
  const chatId = msg.chat.id;
  const numberDhpFetched = numberDhp[1];

  //lidar com os erros

  bot.sendMessage(chatId, dhp_thanissaro[numberDhpFetched]);
  bot.sendMessage(chatId, paliDhp[numberDhpFetched]?.text);

  bot.sendAudio(chatId, `src/dhpjson/audio/anandajoti/${numberDhpFetched}.mp3`);
  bot.sendAudio(chatId, `src/dhpjson/audio/fronsdal/${numberDhpFetched}.mp3`);
});

bot.onText(/\/dhpb (.+)/, async (msg, numberDhp) => {
  const chatId = msg.chat.id;
  const numberDhpFetched = numberDhp[1];

  //lidar com os erros

  bot.sendMessage(chatId, dhp_buddharakkhita[numberDhpFetched]);
  bot.sendMessage(chatId, paliDhp[numberDhpFetched]?.text);

  bot.sendAudio(chatId, `src/dhpjson/audio/anandajoti/${numberDhpFetched}.mp3`);
  bot.sendAudio(chatId, `src/dhpjson/audio/fronsdal/${numberDhpFetched}.mp3`);
});

// Matches "/echo [whatever]"
bot.onText(/\/m (.+)/, async (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  //await bot.sendVideo(msg.chat.id,"src/movies/1.mp4");
  //await mergeTwo();
  //bot.sendMessage(chatId, pathMergedVideo);
  //await bot.sendVideo(msg.chat.id,pathMergedVideo);
  // send back the matched "whatever" to the chat
  //bot.sendMessage(chatId, resposta);
  bot.sendMessage(chatId, resp);

  bot.sendMessage(chatId, resp);
});

function wonderfullFeelings(msg) {
  //bot.sendMessage(msg.chat.id, "Thats amazing!! And whats the feeling ?");
  bot.sendMessage(msg.chat.id, "Thats amazing!! And whats the feeling ?", {
    reply_markup: {
      keyboard: [
        ["alegre", "felicidade", "metta"],
        ["gratidao", "compaixão", "tranquilidade"],
        ["mudita", "serenidade"],
      ],
    },
  });
}

bot.onText(/\/cf9j/, (msg, match) => {
  const chatId = msg.chat.id;
  //bot.sendMessage(chatId, match);
  // const resp = match[1]; // the captured "whatever"

  bot.sendMessage(msg.chat.id, "Qual treino?", {
    reply_markup: {
      keyboard: [["endurance", "wodzin"]],
    },
  });

  bot.sendMessage(chatId, resp);
});

bot.on("message", (msg) => {
  var Hi = "wonderful";
  if (msg.text.toString().toLowerCase().indexOf(Hi) === 0) {
    wonderfullFeelings(msg);
  }
  var bye = "happy";
  if (msg.text.toString().toLowerCase().includes(bye)) {
    bot.sendMessage(msg.chat.id, "Hope to see you around again , Bye");
  }
  var robot = "normal";
  if (msg.text.indexOf(robot) === 0) {
    bot.sendMessage(msg.chat.id, "Yes I'm robot but not in that way!");
  }
  var robot = "bad";
  if (msg.text.indexOf(robot) === 0) {
    bot.sendMessage(msg.chat.id, "Yes I'm robot but not in that way!");
  }
  var robot = "horribble";
  if (msg.text.indexOf(robot) === 0) {
    bot.sendMessage(msg.chat.id, "Yes I'm robot but not in that way!");
  }

  //cf9j
  var resCf9j = "endurance";
  if (msg.text.indexOf(resCf9j) === 0) {
    console.log(typeof obj);
    bot.sendMessage(msg.chat.id, obj[0]);
  }
});

// bot.on('message', (msg) => {
//     const chatId = msg.chat.id;

//     // send a message to the chat acknowledging receipt of their message
//     bot.sendMessage(chatId, 'Received your message');
//   });

// Handle callback queries
bot.on("callback_query", function onCallbackQuery(callbackQuery) {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  const opts = {
    chat_id: msg.chat.id,
    message_id: msg.message_id,
  };
  let text;

  if (action === "edit") {
    text = "Edited Text";
  }

  bot.editMessageText(text, opts);
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome", {
    reply_markup: {
      keyboard: [["wonderfull", "happy"], ["Normal"], ["bad", "horrible"]],
    },
  });
});

// //NOT WORKING ***********
// bot.onText(/\/translate (.+)/, async (msg, match) => {
//   const wordToTranslate = match[1]; // the captured "whatever"
//   const chatId = msg.chat.id;
//   //bot.sendMessage(chatId, match);

//   translate(wordToTranslate, { from: "en", to: "pt" })
//     .then((res) => {
//       console.log(res.text);
//       bot.sendMessage(chatId, res.text);
//       //=> Ik spreek Nederlands!
//       console.log(res.from.text.autoCorrected);
//       //bot.sendMessage(chatId, res.from.text.autoCorrected);
//       //=> true
//       console.log(res.from.text.value);
//       //=> I [speak] Dutch!
//       console.log(res.from.text.didYouMean);
//       //bot.sendMessage(chatId, res.from.text.didYouMean);
//       //=> false
//     })
//     .catch((err) => {
//       console.error(err);
//     });
// });

// async function mergeThis(){
//     // const concat = require('ffmpeg-concat')
//     // const glob=require('glob')

//     // //an array of video path to concatenate
//     // const videos=glob.sync("/Users/caue/Desktop/codes/telegram/src/movies/*.mp4")

//     // const output='./output/concatenated.mp4'

//     // //a function to merge an array of videos with custom music
//     // //and a transition fadegrayscale of 500ms duration between videos.
//     // async function oneTransitionMergeVideos(){
//     //   await concat({
//     //    output,
//     //    videos,
//     //    audio:"/Users/caue/Desktop/codes/telegram/src/musics/1.mp3",
//     //    transition: {
//     //      name:"fadegrayscale",
//     //      duration: 500
//     //    }
//     // })
//     // }

//     // oneTransitionMergeVideos();

//     const concat = require("ffmpeg-concat");

// // concat 3 mp4s together using 2 500ms directionalWipe transitions
// const res = await concat({
//   output: 'test.mp4',
//   videos: [
//     '/Users/caue/Desktop/codes/telegram/src/movies/1.mp4',
//     '/Users/caue/Desktop/codes/telegram/src/movies/12.mp4'
//   ],
//   transition: {
//     name: 'directionalWipe',
//     duration: 500
//   }
// })

// console.log(res);
// }

// async function mergeTwo() {
//   const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
//   const ffmpeg = require("fluent-ffmpeg");
//   ffmpeg.setFfmpegPath(ffmpegPath);
//   let videoStitch = require("video-stitch");

//   //let videoMerge = videoStitch.merge;
//   let videoConcat = videoStitch.concat;

//   videoConcat({
//     // ffmpeg_path: <path-to-ffmpeg> Optional. Otherwise it will just use ffmpeg on your $PATH
//     silent: true, // optional. if set to false, gives detailed output on console
//     overwrite: false, // optional. by default, if file already exists, ffmpeg will ask for overwriting in console and that pause the process. if set to true, it will force overwriting. if set to false it will prevent overwriting.
//   })
//     .clips([
//       {
//         fileName: "/movies/1.mp4",
//       },
//       {
//         fileName: "/movies/1.mp4",
//       },
//     ])
//     .output("myfilename") //optional absolute file name for output file
//     .concat()
//     .then((outputFileName) => {})
//     .catch((error) => {
//       console.error(error);
//     });
// }

bot.onText(/\/dietcfm (.+)/, async (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, match);
  const resp = match[1]; // the captured "whatever"
  bot.sendMessage(chatId, resp);
});

bot.onText(/\/puja (.+)/, async (msg, arrayInMsg) => {
  const pujaName = arrayInMsg[1]; //morning evening reflexions
  const chatId = msg.chat.id;

  let chantingsToSend = "";

  if (pujaName && pujaName === "matutino") {
    for (let i = 0; i < 6; i++) {
      chantingsToSend = "";
      chantingsToSend += `\n ${allChantings[i].title} \n\n${allChantings[i].chant}\n`;
      bot.sendMessage(chatId, chantingsToSend);
    }
    bot.sendMessage(chatId, chantingsToSend);
    bot.sendMessage(chatId, "... carregando o audio do cantico");
    bot.sendAudio(chatId, "src/pujas/audio/dedicacao-de-oferendas.mp3");
  }
});
