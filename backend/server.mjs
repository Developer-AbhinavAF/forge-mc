import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { Client, GatewayIntentBits } from 'discord.js'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const app=express(), port=process.env.PORT||3001, cache=new Map()
app.use(cors());app.use(express.json({limit:'40kb'}))
const cached=async(key,fn,ttl=60000)=>{const hit=cache.get(key);if(hit&&Date.now()-hit.at<ttl)return hit.value;const value=await fn();cache.set(key,{value,at:Date.now()});return value}
let client=null, botError=null
if(process.env.DISCORD_BOT_TOKEN){client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers,GatewayIntentBits.GuildPresences]});client.login(process.env.DISCORD_BOT_TOKEN).catch(error=>{botError='Discord connection unavailable';console.error(error.message)})}
const discordStats=async()=>cached('discord',async()=>{if(!client?.isReady())throw Error('Discord connection unavailable');const guild=process.env.DISCORD_GUILD_ID?await client.guilds.fetch(process.env.DISCORD_GUILD_ID):client.guilds.cache.first();if(!guild)throw Error('Guild unavailable');await guild.members.fetch({withPresences:true});return {name:guild.name,members:guild.memberCount,online:guild.presences.cache.filter(p=>p.status!=='offline').size,available:true}},30000)
app.get('/api/health',(req,res)=>res.json({ok:true,discord:client?.isReady()||false,botError}))
app.get('/api/discord/stats',async(req,res)=>{try{res.json(await discordStats())}catch(error){res.status(503).json({available:false,message:error.message})}})
app.get('/api/discord/channel',async(req,res)=>{try{if(!client?.isReady())throw Error('Discord connection unavailable');const channel=await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);res.json({available:true,name:channel?.name||null,id:channel?.id||null})}catch(error){res.status(503).json({available:false,message:error.message})}})
app.get('/api/discord/announcements',(req,res)=>res.json({available:false,announcements:[],message:'Announcements are not configured yet.'}))
app.get('/api/server/status',async(req,res)=>{const host=process.env.MINECRAFT_SERVER_IP;if(!host)return res.json({online:false,unavailable:true});try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);const response=await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(host)}`,{signal:controller.signal});clearTimeout(timer);const data=await response.json();if(!data.online)return res.json({online:false,unavailable:true});res.json({online:true,players:{online:data.players?.online||0,max:data.players?.max||0},version:data.version||'Unknown',motd:data.motd?.clean?.join(' ')||'',ip:host})}catch{res.json({online:false,unavailable:true})}})
app.post('/api/feedback',async(req,res)=>{const {username,discord,category,rating,message}=req.body||{};if(!username?.trim()||!category||!message?.trim()||message.length>2000)return res.status(400).json({ok:false,message:'Please complete the required fields.'});const entry={id:crypto.randomUUID(),username:username.trim(),discord:discord?.trim()||'',category,rating:Number(rating)||0,message:message.trim(),createdAt:new Date().toISOString()};try{const dir=join(process.cwd(),'backend','data'),file=join(dir,'feedback.json');await mkdir(dir,{recursive:true});let items=[];try{items=JSON.parse(await readFile(file,'utf8'))}catch{}items.push(entry);await writeFile(file,JSON.stringify(items,null,2));if(process.env.DISCORD_FEEDBACK_WEBHOOK)await fetch(process.env.DISCORD_FEEDBACK_WEBHOOK,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({content:`**New Forge feedback · ${entry.category} · ${'★'.repeat(entry.rating)}**\n**${entry.username}** ${entry.discord?`(${entry.discord})`:''}\n${entry.message}`})});res.json({ok:true})}catch{res.status(500).json({ok:false,message:'Your feedback could not be saved.'})}})
app.listen(port,()=>console.log(`Forge backend listening on :${port}`))
