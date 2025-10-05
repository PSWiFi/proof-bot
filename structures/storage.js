import { readdirSync, readFileSync } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Storage {
  databasesDir = path.join(path.resolve(__dirname, ".."), "databases");

  databases = [];

  currentSafeFileWrites = {};
  safeWriteFileQueue = {};

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
}

export const loadStorage = () => {
    global.Storage = new Storage();
}

