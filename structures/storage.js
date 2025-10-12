import { readdirSync, readFileSync, mkdir } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as mongoose from "mongoose";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const linkUserSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  code: { type: String, required: true },
  verified: { type: Boolean, required: true, default: false },
  discord: { type: String, required: true },
});

const GB = 1073741824;

export class Storage {
  databasesDir = path.join(path.resolve(__dirname, ".."), "databases");
  repoDir = path.join(path.resolve(__dirname, ".."), "subrepos");

  databases = [];

  currentSafeFileWrites = {};
  safeWriteFileQueue = {};

  linkUser = mongoose.model("linkUser", linkUserSchema);

    importDatabases() {
    const databaseFiles = readdirSync(this.databasesDir);
    const ids = [];
    for (const fileName of databaseFiles) {
      if (!fileName.endsWith(".json")) continue;

      const id = fileName.substr(0, fileName.indexOf(".json"));
      if (id in this.databases) continue;

      const file = readFileSync(path.join(this.databasesDir, fileName))
        .toString();
      const database = JSON.parse(file);

        ids.push(id);
      this.databases[id] = database;
    }
    console.log("Loaded databases:", ids.join(", "));
  }

  getDatabase(id) {
    if (!(id in this.databases)) this.databases[id] = {};
    return this.databases[id];
  }

  async setDatabase(id) {
    if (!(id in this.databases)) return;
    const contents = JSON.stringify(this.databases[id]);

    await this.safeWriteFile(
      path.join(this.databasesDir, id + ".json"),
      contents
    ).catch(console.error);
  }

  async checkLocalRepoExists(repo) {
    return new Promise(async (resolve, reject) => {
      const dir = path.join(this.repoDir, "proof-" + repo);
      try {
       await fs.access(dir);
        return resolve(true);
      }
      catch (e) {
        return resolve(false);
      }
    });
  }

  async checkFolderExistsWithinRepo(args) {
    return new Promise(async (resolve, reject) => {
      if (!args[0]) return false;
      let dir = path.join(this.repoDir, "proof-" + args[0]);
      for (let i = 1; i < args.length; i++) {
        dir = path.join(dir, args[i]);
      }
      try {
        await fs.access(dir);
        return resolve(true);
      }
      catch (e) {
        return resolve(false);
      }
    });
  }

  async makeDirectory(repo, user) {
      return await mkdir(`${this.repoDir}/proof-${repo}/${user}`, { recursive: true }, (err) => {
        if (err) console.error(err);
      });
  }

  async makeAlbum(repo, user, album) {
    return await mkdir(`${this.repoDir}/proof-${repo}/${user}/${album}`, { recursive: true }, (err) => {
      if (err) console.error(err);
    })
  }

  /**
   * 
   * @param {string} reponame The name of the repository to stat
   * @returns {[size: number, isDirectory: boolean, isAboveSizeCap: boolean] | [null, null, null]}
   */
  async statRepo(reponame) {
    return new Promise(async (resolve, reject) => {
      const dir = path.join(this.repoDir, "proof-" + reponame);
      try {
        const stats = await fs.stat(dir);
        resolve([stats.size, stats.isDirectory(), stats.size > 4 * GB]);
      }
      catch (e) {
        console.error(e, "Error stating directory " + dir);
        resolve([null, null, null]);
      }
    });
  }

  async safeWriteFile(filepath, data) {
    return new Promise((resolve, reject) => {
      if (filepath in this.currentSafeFileWrites) {
        if (!(filepath in this.safeWriteFileQueue))
          this.safeWriteFileQueue[filepath] = [];
        this.safeWriteFileQueue[filepath].push({ data, resolve, reject });
      } else {
        this.currentSafeFileWrites[filepath] = data;
        this.safeWriteFileInternal(filepath, data, resolve, reject);
      }
    });
  }

  async safeWriteFileInternal(filepath, data, resolve, reject) {
    const tempFilepath = filepath + ".temp";
    fs.writeFile(tempFilepath, data)
      .catch((e) => {
        reject(e);
        console.error(e, "Error writing temp file " + tempFilepath);
      })
      .then(() => fs.rename(tempFilepath, filepath))
      .catch((e) => {
        reject(e);
        console.error(e, "Error renaming temp file " + tempFilepath);
      })
      .then(() => {
        resolve();
      })
      .finally(() => {
        if (
          filepath in this.safeWriteFileQueue &&
          this.safeWriteFileQueue[filepath].length
        ) {
          const queuedItem = this.safeWriteFileQueue[filepath][0];
          this.safeWriteFileQueue[filepath].shift();
          if (!this.safeWriteFileQueue[filepath].length)
            delete this.safeWriteFileQueue[filepath];

          this.currentSafeFileWrites[filepath] = queuedItem.data;
          this.safeWriteFileInternal(
            filepath,
            queuedItem.data,
            queuedItem.resolve,
            queuedItem.reject
          );
        } else {
          delete this.currentSafeFileWrites[filepath];
        }
      })
      .catch((e) => {
        console.error(
          e,
          "Error in finally block for temp file " + tempFilepath
        );
      });
  }

  async createLinkUser(name, code, discord) {
    const doc = new this.linkUser({
      _id: name,
      code: code,
      verified: false,
      discord: discord,
    });
    return await doc.save();
  }

  async checkLinkUser(code) {
    const entry = await this.linkUser.findById(code);
    return entry;
  }  
}

export const loadStorage = () => {
  mongoose.connect(process.env.MONGO_URL);
  global.Storage = new Storage();
  global.toId = function toId(string) {
    return string?.toLowerCase?.().replace(/[^a-z0-9]/g, "") ?? "";
  };
}

