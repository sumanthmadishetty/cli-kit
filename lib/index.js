const program = require('commander');
const colors = require('colors');

const { exec, spawn } = require("child_process");
const { readFileSync, writeFileSync } = require('fs');
const chalk = require('chalk');




// import function to list coffeee menu
// print menu



program.command("list").action(() => {
    console.log("%s", colors.green("\nHello world"))
})


program.command("seed_logs").action(() => {

    console.log("Seeding logs")

    exec("aws logs describe-log-groups", (error, stdout, stderror) => {
        if(error) {
            console.error(colors.red(error));
        }
        const logsDataObj = JSON.parse(stdout);
        const convertedLogs = convertLogsbj(logsDataObj.logGroups)
        writeFileSync("./data/logsData.json", JSON.stringify(convertedLogs))
        console.log(colors.green("Logs Seeded Successfully"))
    })
})

program.command("list-logs").alias("l").argument("[log group]", "Log Group to tail", "").action((logGroup, b) => {
    if(logGroup) {
        return startStreamingLogGroup(logGroup)
    }
    
    const commands = JSON.parse(readFileSync("data/logsData.json"))
    const devCommands = commands.dev
    console.log(chalk.green.underline("****************** DEV ******************"))
    printTable(devCommands)
    console.log(chalk.red("****************** PROD ******************"))
    printTable(commands.prod)
    console.log(chalk.yellow("****************** DEMO ******************"))
    printTable(commands.demo)
    console.log(chalk.blue("****************** OTHERS ******************"))
    printTable(commands.others)

})


function startStreamingLogGroup(logGroup) {
    const commands = JSON.parse(readFileSync("data/logsData.json"))
    const re = []
    Object.values(commands).forEach(val => {
        if(Array.isArray(val)) {
           val.forEach(i => re.push(i))
        } else {
            re.push(val)
        }
    })
    const logGrp = re.find(i => i.code === logGroup);
    if(logGroup) {
        console.log(chalk.green("Starting streaming logs"))
        const command = `aws logs tail ${logGrp.group} --follow`
        console.log(chalk.blue(command))
        const d = exec(command)
        
        d.stdout.on("data", function(data) {
            console.log(data)

        })
    } else {

        console.error("Invalid log group", logGroup)
    }
}


function printTable(array, color) {
    const r = array.map((i) => ({ service: i.name, "Log Group": (i.group), "Code": (i.code) }))
    return console.table(r)
}



function convertLogsbj(logsArray) {
    const result = {
        "dev": [],
        "prod": [],
        "demo": [],
        "others": []
    };
    logsArray.forEach(element => {
        const logGroupName = element.logGroupName;
            if(element.logGroupName.includes("dev")) {
                result.dev.push({ "name": logGroupName.split("/").at(-1), group: logGroupName, code: `d${result.dev.length}`  })
            } else  
            if(element.logGroupName.includes("prod")) {
                result.prod.push({ "name": logGroupName.split("/").at(-1), group: logGroupName, code: `p${result.prod.length}`  })
            } else
            if(element.logGroupName.includes("demo")) {
                result.demo.push({ "name": logGroupName.split("/").at(-1), group: logGroupName, code: `de${result.demo.length}`  })
            } else {
                result.others.push({ "name": logGroupName.split("/").at(-1), group: logGroupName, code: `o${result.others.length}`  })
            }
    });
    return result

}

program.parse(process.argv)