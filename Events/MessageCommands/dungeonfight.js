const Discord = require('discord.js');
const PLAYERDATA = require('../../modules/player.js');
const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, Message, Events, ButtonStyle, ComponentType } = require('discord.js');
const { prefix } = require('../../App/config.json');
const { numStr } = require('../../functionNumber/functionNbr.js');
const DUNGEONS = require('../../config/dungeons.json');
const STATS = require('../../modules/statsBot.js');
const SQUADDATA = require('../../modules/squad.js')
const EMOJICONFIG = require('../../config/emoji.json');
const BALANCEDATA = require('../../modules/economie.js');
const { bold, inlineCode, codeBlock } = require('@discordjs/builders');
const configLevel = require('../../config/configLevel.json');
const CONFIGITEM = require('../../config/stuff.json')
const {client} = require('../../App/index.js');
const monster = require('./monster.js');
const Party = require('../../modules/party.js');
const CRAFTS = require('../../config/craft.json');
const shuffleTime = 30000;

module.exports = {

    name: Events.MessageCreate,

    async execute(message, args, command) {
        var user = message.author;
        let commandName;
        if (typeof command === 'string') {
            let fullCommand = command.split(' ');
            commandName = fullCommand.shift().toLowerCase();
            args = fullCommand.concat(args);
        } else if (message && message.content) {
            if (!message.mentions.has(client.user)) return;
            const cleanMessage = message.content.replace(/<@!?[0-9]+>/, '').trim();
            let fullCommand = cleanMessage.split(/ +/);
            commandName = fullCommand.shift().toLowerCase();
            args = fullCommand;
        } 
    
        if (this.info.names.some(name => commandName === name)) {

        const dungeonAlias = args[0];
        if (!args[0]) {
            message.channel.send('Please use `@Eternals list dungeons` to view all dungeons. Usage: `@Eternals df <dungeon>`');
            return;
        }
        
        let dungeonName;
        for (const dungeon in DUNGEONS) {
            if (DUNGEONS[dungeon].alias === dungeonAlias || dungeon === dungeonAlias) {    
            dungeonName = dungeon;    
              break;   
            }   
          }
          const dungeon = DUNGEONS[dungeonName];
          const dungeonDisplay = dungeon.display;

        if (!dungeonName || !DUNGEONS[dungeonName]) {
            return message.reply(`Please specify a valid dungeon. Usage: \`${prefix}dungeonfight <dungeonName>\``);
        }
        if (!commandName === 'dungeonfight') return;
        let playerStats = await PLAYERDATA.findOne({ userId: message.author.id });
        if (!playerStats) {
            return message.reply('You are not a player! Use `@Eternals start` to begin your adventure.');
        }    
        if (playerStats.player.energy < 2) return message.reply(`${EMOJICONFIG.no} You don't have enough energy! Restore your energy with ${inlineCode('@Eternals energy')}`)


        let balance = await BALANCEDATA.findOne({ userId: message.author.id });
        if (!balance) return message.reply(`${EMOJICONFIG.no} you are not a player ! : ${inlineCode('@Eternals start')}`);
        else {
            if (playerStats.player.cooldowns && playerStats.player.cooldowns.dungeon) {
                const timeSinceLastDaily = new Date().getTime() - new Date(playerStats.player.cooldowns.dungeon).getTime();
                if (timeSinceLastDaily < shuffleTime) {
                    var measuredTime = new Date(null);
                    measuredTime.setSeconds(Math.ceil((shuffleTime - timeSinceLastDaily) / 1000));
                    var MHSTime = measuredTime.toISOString().substr(11, 8);
                    message.channel.send(`${EMOJICONFIG.hellspawn} Please wait \`${MHSTime}\` and try again.`);
                    return;
                }
            }
    
            let stats = await STATS.findOne({ botID: 899 });
            const dungeonConfigtrash = require(`../../config/${dungeonName}.trash.json`);
            const dungeonConfigelite = require(`../../config/${dungeonName}.elite.json`);
            const dungeonConfigboss = require(`../../config/${dungeonName}.boss.json`);

            const dungeon = DUNGEONS[dungeonName];
            const progressProperty = dungeon.progressProperty;

            if (playerStats.player.other[progressProperty] === 0) {
            let requiredTotem = CRAFTS.find(item => item.dungeon === dungeonName);

            if (requiredTotem) {
                let playerHasTotem = playerStats.player.stuff.gem.find(item => item.name === requiredTotem.name && item.amount > 0);
                if (!playerHasTotem) {
                    return message.reply(`You need a ${requiredTotem.name} to enter this dungeon.`);
                }
                else {
                    if (playerStats.player.other[progressProperty] === 0) {
                    playerHasTotem.amount -= 1;
                    }
                }
            }        
        }


            if (playerStats.player.other[progressProperty] === 0) {
              playerStats.player.other[progressProperty] = 1;
            
            }
            if (playerStats.player.other[progressProperty] <= 5) {
                monstersConfig = dungeonConfigtrash;
            } else if (playerStats.player.other[progressProperty] <= 7) {
                monstersConfig = dungeonConfigelite;
            } else {
                monstersConfig = dungeonConfigboss;
            }
            // Select a random monster from the appropriate list
    
            var progb = playerStats.player.other[progressProperty];

            let randomIndex = Math.floor(Math.random() * monstersConfig.length);
    
            let selectedMonster = monstersConfig[randomIndex];


    

            function dodgeFunction(dodge){
                // True = dodge, False = not dodge
                if((Math.floor(Math.random() * 100) + 1) < dodge){
                    return true
                } else {
                    return false
                }
            };

            function critFunction(crit){
                // True = critik, False = not critik
                if((Math.floor(Math.random() * 100) + 1) < crit){
                    return true
                } else {
                    return false
                }
            };

            function addSquadXp(squad, xpUserEarn){
                if (!squad) return
                else {
                    squad.squadXp += Math.floor(xpUserEarn * 0.15)
                    squad.save()
                }
            };





// Add this function to player.js
function calculateTotalItemBonuses(playerStats) {
    let totalBonuses = {
        attack: 0,
        defense: 0,
        health: 0,
        crit: 0,
        dodge: 0,
    };

    // Loop through each slot and add the item bonuses to totalBonuses
    for (const slot in playerStats.player.slotItem) {
        const itemId = playerStats.player.slotItem[slot];
        if (itemId !== -1) {
            const item = CONFIGITEM.find(item => item.id === itemId);
            if (item) {
                totalBonuses.attack += item.levelAttack.level1;
                totalBonuses.defense += item.levelDefense.level1;
                totalBonuses.crit += item.levelCrit.level1;
                totalBonuses.dodge += item.levelDodge.level1;
            }
        }
    }
    
    return totalBonuses;
}

function xpToLevel(level) {
    let total = 0;
    for (let l = 1; l < level; l++) {
        total += Math.floor(l + 300 * Math.pow(2, l / 7.0));
    }
    return Math.floor(total / 4);
}

function xpToNextLevel(currentLevel) {
    return xpToLevel(currentLevel + 1) - xpToLevel(currentLevel);
}

              function checkForLevelUp(playerStats) {
                let leveledUp = false;
                
                    if (playerStats.player.level >= 120) {
                        leveledUp = false;
                        return;
                    }
                
                let currentLevel = playerStats.player.level;
                let currentXP = balance.eco.xp;
                let xpNeeded = xpToNextLevel(currentLevel);
                let levelConfig = configLevel[`level${currentLevel}`];
                if (!levelConfig) {
                    console.log("Level configuration not found for level:", currentLevel);   
                    return;           
                }
                
                
                if (currentXP >= xpToNextLevel(currentLevel)){
                     leveledUp = true;
                     
                }
                else {
                     leveledUp = false;
                }
                while (currentXP >= xpNeeded) {    
                    currentLevel++;
                    currentXP -= xpNeeded;
                    xpNeeded = xpToNextLevel(currentLevel);
                    levelConfig = configLevel[`level${currentLevel}`];
                    if (!levelConfig) {
                        //console.log("Max level reached or level config not found");
                        break;
                }
                

                const itemBonuses = calculateTotalItemBonuses(playerStats);
                totalatk = levelConfig.stats.attack + itemBonuses.attack;
                totaldef = levelConfig.stats.defense + itemBonuses.defense;
                totalhealth = levelConfig.stats.health;
                totaldod = levelConfig.stats.dodge + itemBonuses.dodge;
                totalcrit = levelConfig.stats.crit + itemBonuses.crit;
                playerStats.player.attack = totalatk;
                playerStats.player.defense = totaldef;
                playerStats.player.health = totalhealth;
                playerStats.player.dodge = totaldod;
                playerStats.player.crit = totalcrit;
                playerStats.player.level = currentLevel;
                balance.eco.xp = currentXP;
                
            
            }           


            
    }
    function dropItems(monster) {
        const drops = monster.drops;
        if (!drops) {
            return [];
        }
        let result = [];
        for (let i = 0; i < drops.length; i++) {
            const drop = drops[i];
            const randomNum = Math.random();
            if (randomNum <= drop.dropRate) {
                result.push(drop);
            }
        }
        return result;
    }
    

            function dropRareBox(playerProgress) {

                if (playerProgress === 8) {
   
                   const rareBoxDropRate = 0.20;             
                   const randomNum = Math.random();          
                    if (randomNum <= rareBoxDropRate) {          
                        return {       
                            dropped: "yes" // Replace with the actual item ID for the rarebox     
                        };
                    }   
                }       
                return null;      
            }


            const droppedItem = dropItems(selectedMonster);
            // [=================== BATTLE FUNCTION ===================]

            async function battle(MAXATK_PLAYER, MAXATK_MONSTER, HEALTH_PLAYER, HEALTH_MONSTER, DEFENSE_MONSTER, DODGEPLAYER, CRITPLAYER, MAXXP, DEFENSE_PLAYER){
    
                var monsterStats_atk = MAXATK_MONSTER
                var monsterStats_hth = HEALTH_MONSTER
                var NB_CRIT = 0
                var NB_DODGE = 0
                var NB_ATTACK_PLAYER = 0
                var NB_ATTACK_MONSTER = 0
                var ATK_SOMME_PLAYER = 0
                var ATK_SOMME_MONSTER = 0

                
                let droppedItems = dropItems(selectedMonster);

                for (let droppedItem of droppedItems) {
                    let alreadyHasItem = playerStats.player.stuff.stuffUnlock.find(item => item.id === Number(droppedItem.itemId));
                    stats.amoutItem += 1;
                    if (alreadyHasItem) {
                        alreadyHasItem.amount += 1;
                    } else {
                    playerStats.player.stuff.stuffUnlock.push({
                    id: droppedItem.itemId,
                    name: droppedItem.name,
                    level: 1,
                    amount: 1
                    });
                    }
                    }



                while(HEALTH_PLAYER != 0 || HEALTH_MONSTER != 0){
                   // console.log(HEALTH_PLAYER)
                    // ==== Player Attack ====
                    if(CRITPLAYER == false){
                        var attackDamagePLayer = Math.floor(Math.random() * MAXATK_PLAYER) + 1 - (DEFENSE_MONSTER * 0.5);
                        attackDamagePLayer = isNaN(attackDamagePLayer) ? 10 : attackDamagePLayer;
                        attackDamagePLayer = attackDamagePLayer < 0 ? 10 : attackDamagePLayer;
                        NB_ATTACK_PLAYER = NB_ATTACK_PLAYER + 1;
                        ATK_SOMME_PLAYER = ATK_SOMME_PLAYER + attackDamagePLayer;
                        HEALTH_MONSTER = HEALTH_MONSTER - attackDamagePLayer;
                    } else {
                        var attackDamagePLayerCrit = Math.floor(Math.random() * (MAXATK_PLAYER + CRITPLAYER)) + 1 - (DEFENSE_MONSTER * 0.5);
                        attackDamagePLayerCrit = isNaN(attackDamagePLayerCrit) ? 1 : attackDamagePLayerCrit;
                        attackDamagePLayerCrit = attackDamagePLayerCrit < 0 ? 10 : attackDamagePLayerCrit;
                        NB_CRIT += 1;
                        NB_ATTACK_PLAYER = NB_ATTACK_PLAYER + 1;
                        ATK_SOMME_PLAYER = ATK_SOMME_PLAYER + attackDamagePLayerCrit;
                        HEALTH_MONSTER = HEALTH_MONSTER - attackDamagePLayerCrit;
                    }
                
                    if(DODGEPLAYER == false){
                        var attackDamageMonster = Math.floor(Math.random() * MAXATK_MONSTER) - (DEFENSE_PLAYER * 0.5);
                        attackDamageMonster = isNaN(attackDamageMonster) ? 10 : attackDamageMonster;
                        attackDamageMonster = attackDamageMonster < 0 ? 10 : attackDamageMonster;

                        NB_ATTACK_MONSTER = NB_ATTACK_MONSTER + 1;
                        ATK_SOMME_MONSTER = ATK_SOMME_MONSTER + attackDamageMonster;
                        HEALTH_PLAYER = HEALTH_PLAYER - attackDamageMonster;
                   } else {
                        NB_DODGE = NB_DODGE + 1;
                        NB_ATTACK_MONSTER = NB_ATTACK_MONSTER + 1;
                        HEALTH_PLAYER = HEALTH_PLAYER;
                    }

                    if (HEALTH_PLAYER <= 0){
                    // =========== PLAYER LOSE ===========
                    let currentLevel = playerStats.player.level;
                    let levelConfig = configLevel[`level${currentLevel}`];
                    const itemBonuses = calculateTotalItemBonuses(playerStats);
                    var totalhealth = levelConfig.stats.health;
                    
                    var losecoin = Math.floor((balance.eco.coins*10)/100)

                        balance.eco.coins = Math.floor(balance.eco.coins - losecoin)
                        balance.save()

                        playerStats.player.health = totalhealth;
                        playerStats.player.other[progressProperty] = 0;
                        playerStats.player.cooldowns = playerStats.player.cooldowns || {};
                        playerStats.player.cooldowns.dungeon = new Date().toISOString();
                        playerStats.player.energy -= 2;
                        playerStats.player.potion = {
                            id: 0,
                            name: "",
                            attack: 0,
                            defense: 0,
                            dodge: 0,
                            crit: 0
                        }
                       await playerStats.save()

                        // ==== Embed LOSE ====
                        var battleEmbed = new Discord.EmbedBuilder()
                            .setColor('#9696ab')
                            .setTitle(`${dungeonDisplay} - Floor ${progb} / 8` )
                            .setDescription(`${user.username} vs ${monsterName} \n`)
                            .addFields(
                                { name: `**${EMOJICONFIG.helmet} ${user.username} :**\n`, value: `**Attack** : ${Player_Attack}\n**Defense** : ${Player_Defense}\n**Health** : ${numStr(playerStats.player.health)}\n `, inline: true },
                                { name: `**${EMOJICONFIG.hat7} ${monsterName} :**\n`, value: `**Attack** : ${monsterStats_atk}\n**Defense** : ${DEFENSE_MONSTER}\n**Health** : ${numStr(monsterStats_hth)}\n`, inline: true },
                                { name: `**${EMOJICONFIG.scroll4} STATS :**\n`, value: `** ${EMOJICONFIG.no} YOU LOSE...**\n${EMOJICONFIG.coinchest} You lose **10%** of your ${EMOJICONFIG.coin} ( -**${numStr(losecoin)}**)\n${EMOJICONFIG.no} You have been kicked out of the dungeon`, inline: false },
                            )
                            .setTimestamp();
                        return battleEmbed
                    };
                    if (HEALTH_MONSTER <= 0){
                    // =========== PLAYER WIN ===========
                        let playerWon = true;
                        var randomcoin = Math.floor((Math.random() * (MAXXP / (MAXXP/155)))) + 1;
                        var randombox = Math.floor(Math.random() * 99);
                        var randomxp = selectedMonster.xpReward;
                        

                        const rareBoxDropped = dropRareBox(playerStats.player.other[progressProperty]);
                        if (rareBoxDropped) {
                        playerStats.player.other.rarebox += 1
                        }

                        playerStats.player.other[progressProperty]++;
                        if (playerStats.player.other[progressProperty] > 8) {
                            playerStats.player.other[progressProperty] = 0;
                        }
                    
                        if (randombox >= 94){
                        var boxwin = 1;
                            playerStats.player.other.box += 1
                        }
                        else {
                            var boxwin = 0;
                        }
                        playerStats.player.health = HEALTH_PLAYER;
                        playerStats.player.other.monsterKill += 1
                        playerStats.player.energy -= 2;
                        playerStats.player.potion = {
                            id: 0,
                            name: "",
                            attack: 0,
                            defense: 0,
                            dodge: 0,
                            crit: 0
                        }

                        balance.eco.coins = balance.eco.coins + randomcoin

                        balance.eco.xp += randomxp
                        balance.eco.totalxp += randomxp

                        async function partyxp() {
                            const party = await Party.findOne({ member: { $elemMatch: { id: message.author.id } } });
                            let sharedXpPercentage = 0;
                            let inparty = false;            

                        if (party && party.member.length > 1) {
                            inparty = true;
                        const additionalXPPerMember = Math.floor(randomxp * 0.02);
                        const totalAdditionalXP = Math.min(additionalXPPerMember * party.member.length, Math.floor(randomxp * 0.10));
                        sharedXpPercentage = (totalAdditionalXP / randomxp) * 100;
                            for (const member of party.member) {
                                if (member.id === message.author.id) return;
                                let memberBalance = await BALANCEDATA.findOne({ userId: member.id });
                                let memberBalance2 = await PLAYERDATA.findOne({ userId: member.id });

                                if (memberBalance && memberBalance2) {
                                memberBalance.eco.xp += totalAdditionalXP;
                                memberBalance.eco.totalxp += totalAdditionalXP;
                             await memberBalance.save();
                             await memberBalance2.save();
                        }            
                   }
                }
                return {inparty, sharedXpPercentage};
            }





                        const playerLeveledUp = checkForLevelUp(playerStats);
                        checkForLevelUp(playerStats);
                        partyxp();
                        
                       // playerStats.player.cooldowns = playerStats.player.cooldowns || {};
                        playerStats.player.cooldowns.dungeon = new Date().toISOString();
            
                        stats.amoutCoin += randomcoin;
                        stats.amoutMonsterKilled += 1;
                        await stats.save();
                        await playerStats.save();
                        await balance.save();

                        // === DM DIARY ===

                        if(NB_DODGE == undefined) NB_DODGE = 0
                        if(NB_CRIT == undefined) NB_CRIT = 0
                        // ==== Embed WIN ====
        
                        var progressDisplay = playerStats.player.other[progressProperty] === 0 ? "Complete" : `(${playerStats.player.other[progressProperty]} / 8)`;
                        var progressMessage = playerStats.player.other[progressProperty] === 0 ? `You have completed the ${dungeonDisplay} Dungeon!` : `You Progress in the Dungeon to floor ${progressDisplay} in ${dungeonDisplay}`;

                        var battleEmbed = new Discord.EmbedBuilder()
                            .setColor('#fc9803')
                            .setTitle(`${dungeonDisplay} - Floor ${progb} / 8`, '')
                            .setDescription(`${client.users.cache.get(user.id).username} vs ${monsterName} in ${dungeonDisplay} Dungeon\n`)
                            .addFields(
                                { name: `**${EMOJICONFIG.helmet} ${client.users.cache.get(user.id).username} :**\n`, value: `**Attack** : ${Player_Attack}\n**Defense** : ${Player_Defense}\n**Health** : ${playerStats.player.health}\n `, inline: true },
                                { name: `**${EMOJICONFIG.hat7} ${monsterName} :**\n`, value: `**Attack** : ${monsterStats_atk}\n**Defense** : ${DEFENSE_MONSTER}\n**Health** : ${monsterStats_hth}\n `, inline: true },
                                { name: `**${EMOJICONFIG.scroll4} STATS :**\n`, value: `**YOU WIN**\n${EMOJICONFIG.yes} And get: **${inlineCode(numStr(randomxp))}** ${EMOJICONFIG.xp} - **${inlineCode(numStr(randomcoin))}** ${EMOJICONFIG.coin} - **${inlineCode(numStr(boxwin))}** ${EMOJICONFIG.coinchest} `, inline: false },
                                { name: `**${EMOJICONFIG.paper} Dungeon Progress :**\n`, value: progressMessage},
                                
                            )
                            .setTimestamp();
                            for (let droppedItem of droppedItems) {                    
                                battleEmbed.addFields({ name: '**Dropped Item:** ', value: `You received the item: **${droppedItem.name}**!\n`});                                                                  
                        }

                            if (rareBoxDropped) {
                                battleEmbed.addFields({ name: '**Rare Box:** ', value: `Whoa! You received a rare box!\n`});
                           }
                            
                            if (playerLeveledUp) 
                            { 
                            battleEmbed.addFields({ name: '**Level Up!** ', value: `You are now level **${playerStats.player.level}**!`});

                            const logChannel = client.channels.cache.get('1169491579774443660');
                            var now = new Date();
                            var date = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
                            var messageEmbed = new EmbedBuilder()
                            .setColor('#D5EB0D')
                            .setTitle(`Log ${date}`)
                            .setDescription(`${EMOJICONFIG.attack} ${inlineCode(user.username)} is now level **${playerStats.player.level}**!`);
                            logChannel.send({embeds: [messageEmbed], ephemeral: true });
                            }
                        return battleEmbed

                    }
                    
        
                
                

                }; 

            };



            var monsterName = selectedMonster.name;     
            


            var MonsterLevel = selectedMonster.level;
            var MonsterAttack = selectedMonster.attack;
            var MonsterDefense = selectedMonster.defense;
            var MonsterHealth = selectedMonster.health;

            
            let Player_Attack;
            let Player_Defense;
            let Dodge_PLayer;
            let Crit_PLayer;
            
            if (playerStats.player.potion.id !== 0) {
                 Player_Attack = playerStats.player.attack + playerStats.player.potion.attack;
                 Player_Defense = playerStats.player.defense + playerStats.player.potion.defense;
                 Dodge_PLayer = dodgeFunction(playerStats.player.dodge + playerStats.player.potion.dodge)
                 Crit_PLayer = critFunction(playerStats.player.crit + playerStats.player.potion.crit)
    
            }
            else {            
                 Player_Attack = playerStats.player.attack;
                 Player_Defense = playerStats.player.defense;
                 Dodge_PLayer = dodgeFunction(playerStats.player.dodge)
                 Crit_PLayer = critFunction(playerStats.player.crit)
            }

            if(Player_Attack <= 0) Player_Attack = 0
            if(MonsterAttack <= 0) MonsterAttack = 0
            if(MonsterHealth <= 0) MonsterHealth = 0
            if(MonsterHealth <= 0) MonsterHealth = 0


            function winPercentage(){            
                var totalStatsPlayer = Player_Attack * (playerStats.player.health + (Player_Defense * 0.5))

                var totalStatsMonster = MonsterAttack * (MonsterHealth + (MonsterDefense * 0.5))

                var totalStats = totalStatsPlayer + totalStatsMonster

                var percentageWin = (100 * totalStatsPlayer) / totalStats

                var percentageWin = new Discord.EmbedBuilder()
                    .setColor('#ce2dcb')
                    .setTitle(`${EMOJICONFIG.scroll4} ${user.username}'s Win %`)
                    .setDescription(`📰 ${inlineCode(user.username)} vs ${inlineCode(monsterName)}\n`)
                    .addFields(
                        {name: `${EMOJICONFIG.helmet} ${user.username}:`, value:`${EMOJICONFIG.attack}: ${Player_Attack}\n${EMOJICONFIG.shield2}: ${Player_Defense}\n${EMOJICONFIG.heart}: ${playerStats.player.health}`, inline: true},
                        {name: `${EMOJICONFIG.hat7} ${monsterName}:`, value:`${EMOJICONFIG.attack}: ${MonsterAttack}\n${EMOJICONFIG.shield2}: ${MonsterDefense}\n${EMOJICONFIG.heart}: ${MonsterHealth}`, inline: true},
                        {name: `${EMOJICONFIG.paper} Result :`, value:`Your percentage chance of winning is : **${Math.floor(percentageWin)}%**`, inline: false},
                    )
                    .setTimestamp();
                return percentageWin
            };


            // [=========== BUTTON MESSAGE ===========]
            var rM = Math.floor(Math.random() * 2)

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('yes')
                        .setLabel(`ATTACK`)
                        .setStyle(ButtonStyle.Success)
                        .setEmoji(`${EMOJICONFIG.yes}`),
                    
                    new ButtonBuilder()
                        .setCustomId('no')
                        .setLabel(`RUN`)
                        .setEmoji(`${EMOJICONFIG.no}`)
                        .setStyle(ButtonStyle.Danger),
                    
                    new ButtonBuilder()
                        .setCustomId('percentage')
                        .setLabel('WIN %')
                        .setStyle(ButtonStyle.Secondary),
                );

            const embedMessage = new EmbedBuilder()
                .setColor('#ce2dcb')
                .setTitle(`${dungeonDisplay} - Floor ${playerStats.player.other[progressProperty]} / 8`)
                .addFields(
                    { name: `**${EMOJICONFIG.helmet} ${user.username} :**\n`, value: `${EMOJICONFIG.attack}: ${Player_Attack}\n${EMOJICONFIG.shield2}: ${Player_Defense}\n${EMOJICONFIG.heart}: ${playerStats.player.health}`, inline: true},
                    { name: `**${EMOJICONFIG.hat7} ${monsterName}, lvl: ${MonsterLevel} :**\n`, value: `${EMOJICONFIG.attack}: ${MonsterAttack}\n${EMOJICONFIG.shield2}: ${MonsterDefense}\n${EMOJICONFIG.heart}: ${MonsterHealth}`, inline: true},
                )
                .setTimestamp()

            const msg = await message.reply({ embeds: [embedMessage], ephemeral: true, components: [row] } );
            
            const collector = msg.createMessageComponentCollector({
                componentType: ComponentType.Button,
                max: 1,
                time: 180_000
            });
            
            collector.on('collect', async interaction => {
                try {
                if (interaction.customId == 'yes') {
                    


                    // ================ AD SQUAD XP ================
                    squad = await SQUADDATA.findOne({ squadName: playerStats.player.other.squadName })
                    if(squad){
                        var randomxp = Math.floor(Math.random() * (playerStats.player.health / 60)) + 1;
                        addSquadXp(squad, randomxp)
                    }

                    // ================= LEVEL CONFIG =================
                    await interaction.reply({ embeds:[await battle(Player_Attack, MonsterAttack, playerStats.player.health, MonsterHealth, MonsterDefense, Dodge_PLayer, Crit_PLayer, Math.floor(Math.random() * (playerStats.player.health*18)/10), Player_Defense)], ephemeral: true });
                }
                else if (interaction.customId == 'percentage') {
                    collector.options.max = 2

                    await interaction.reply({ embeds: [winPercentage()], ephemeral: true });
                }
                else if (interaction.customId === 'no') 
                { await interaction.reply({content: `${EMOJICONFIG.no} You prefer to dodge the monster...`, ephemeral: true}); 
            }
            } catch (error) {

                console.error('Error handling button interaction:', error);
        
                await interaction.reply({ content: 'There was an error handling this interaction.', ephemeral: true }).catch(console.error);
            }
        
            });
            
        };
}; 
    },
    info: {

        names: ['dungeonfight', 'df'],

    }

};