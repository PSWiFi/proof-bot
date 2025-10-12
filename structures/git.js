import { exec } from "node:child_process";

export const setupNewRepo = async (interaction) => {
    return new Promise(async (resolve, reject) => {
        var curr = Storage.getDatabase("repo");
        if (!curr.repo) curr.repo = 0;
        if (!curr.old) curr.old = [];
        curr.old.push(curr.repo);
        curr.repo += 1;
        await Storage.setDatabase("repo");

        const name = `proof-${curr.repo}`;
        const child = exec(`cd ${Storage.repoDir} && mkdir ${name} && cd ${name} && echo # ${name} >> README.md && git init && git add . && git commit -m "initial commit" && git branch -M main && git remote add origin https://github.com/PSWiFi/${name}.git && git push -u origin main`, (err, stdout, stderr) => {
            if (err) {
                interaction.editReply("Something went wrong setting up a new repo! ```" + err + "```");
                console.error(err);
            }
            if (stdout) return removeOldRepo(interaction);
            console.error(stderr);
        });
        child.on("close", () => {
            resolve(child.stdout);
        });
    });
}

function removeOldRepo(interaction) {
    var curr = Storage.getDatabase("repo");
    var last = curr.repo - 1;
    const name = `proof-${last}`;

    exec(`cd ${Storage.repoDir} && rm -rf ${name}`, (err, stdout, stderr) => {
        if (err) {
            interaction.editReply("Something went wrong deleting the old repo! ```" + err + "```");
          console.error(err);
        }
        if (stdout) return interaction.editReply("```" + stdout + "```");
        console.error(stderr);
    });
}

const remoteBase = "https://github.com/PSWiFi/proof-";

export const checkRemoteExists = async (repo) => {
    return new Promise((resolve, reject) => {
        const remote = remoteBase + repo + ".git";
        var c = ""
        const child = exec(`git ls-remote -h ${remote}`, (err, stdout, stderr) => {
            if (err) console.error(err);
            if (stdout) c = stdout;
            if (stderr) console.error(stderr);
        });
        child.on("close", () => {
            resolve([c, remote]);
        });
    });
};

export const clone = async (remote) => {
    return new Promise((resolve, reject) => {
        const child = exec(`cd ${Storage.repoDir} && git clone ${remote}`, (err, stdout, stderr) => {
            if (err) console.error(err);
            if (stdout) console.log(stdout);
            if (stderr) console.error(stderr);
        });
        child.on("close", () => {
            resolve(child.stdout);
        });
    });
}

export const pull = async (repo) => {
    return new Promise((resolve, reject) => {
        const child = exec(`cd ${Storage.repoDir}/proof-${repo} && git pull`, (err, stdout, stderr) => {
            if (err) console.error(err);
            if (stdout) console.log(stdout);
            if (stderr) console.error(stderr);
        });
        child.on("close", () => {
            resolve(child.stdout);
        });
    });
}

