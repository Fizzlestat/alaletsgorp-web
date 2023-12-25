const express = require('express');
const Discord = require('discord.js');
const fs = require('then-fs');

const client = new Discord.Client();
const app = express();

require('dotenv').config();

const token = process.env.token;
const prefix = process.env.prefix;

client.embedMaker = function embedMaker(author, title, description) {
    let embed = new Discord.MessageEmbed();
    embed.setColor(process.env.embedColor);
    embed.setAuthor(author.tag, author.displayAvatarURL());
    embed.setTitle(title);
    embed.setDescription(description);
    return embed;
}

const commandList = [];

app.get('/', async (request, response) => {
     response.sendStatus(200);
});

app.get(`/get-request`, async (request, response) => {
    response.status(200).send(client.request);
});

app.post(`/verify-request`, async (request, response) => {
    let commandRequest = client.request;
    if(commandRequest === "No request") return response.sendStatus(200);
    let successStatus = request.headers.success;
    let message = request.headers.message;

    let channel = client.channels.cache.get(commandRequest.channelID);
    if(!channel) {
        return response.sendStatus(200);
    }

    if(successStatus == "true") {
        if("moderator" in request.headers) {
            let embed = client.embedMaker(client.users.cache.get(commandRequest.authorID), "Success", message)
            embed.addField("Ban Information", `**Admin**: ${request.headers.moderator}\n**Reason**: ${request.headers.reason}`);
            channel.send(embed);
        } else if("achat" in request.headers){
       console.log('That was an achat, not responding.');
    }
    else if("log" in request.headers){
        client.channels.cache.get('1188294856792092683').Send(request.headers.reason)
    }
        else {
            channel.send(message);
        }
    } else {
        channel.send(message);
    }

    client.request = "No request";

    return response.sendStatus(200);
});



async function readCommandFiles() {
    let files = await fs.readdir(`./commands`);

    for(var i = 0; i < files.length; i++) {
        let file = files[i];
        if(!file.endsWith(".js")) throw new Error(`Invalid file detected in commands folder, please remove this file for the bot to work: ${file}`);
        let coreFile = require(`./commands/${file}`);
        commandList.push({
            file: coreFile,
            name: file.split('.')[0]
        });
    }
}

client.on('ready', async() => {
    console.log(`Logged into the Discord account - ${client.user.tag}`);
    await readCommandFiles();
    client.request = "No request";
    client.commandList = commandList;
});

client.on("message", async message => {
    if(message.author.bot) return;
    if(message.channel.type == "dm") return;
    if(!message.content.startsWith(prefix) && message.channel.id == "809595411823722527") {
        let newRequest = {
        userToCheck: message.content,
        authorOfMessage: message.member.displayName,

        type: "Achat",
        channelID: message.channel.id,
        authorID: message.author.id
    }

    client.request = newRequest;
    }
    else if (!message.content.startsWith(prefix) && message.channel.id !== "809595411823722527"){
      return;}
    const args = message.content.slice(prefix.length).split(" ");
    let command = args.shift().toLowerCase();
    let index = commandList.findIndex(cmd => cmd.name === command);
    if (index == -1) return;
    commandList[index].file.run(message, client, args);
});

let listener = app.listen(process.env.PORT, () => {
    console.log(`Relay's listening on port: ${listener.address().port}`);
});

client.login(token);