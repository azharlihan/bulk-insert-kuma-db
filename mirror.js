const sqlite3 = require("sqlite3").verbose();
const filepath = "./kuma.db";
const { parse } = require("csv-parse");
const fs = require("fs");

function createDbConnection() {
  const db = new sqlite3.Database(filepath, (error) => {
    if (error) {
      return console.error(error.message);
    }
  });
  return db;
}

const db = createDbConnection();

function syncMonitor() {
  const monitors = fs.readFileSync("./monitor.csv").toString();

  parse(
    monitors,
    { delimiter: ",", columns: true, trim: true },
    function (err, output) {
      updateOrInsert(output);
    }
  );
}

function setDefaultMonitorValue(monitors) {
  monitors.forEach((monitor) => {
    monitor.active = 1;
    monitor.user_id = 1;
    monitor.interval = 600;
  });

  return monitors;
}

function updateOrInsert(monitors) {
  setDefaultMonitorValue(monitors);

  monitors.forEach((monitor) => {
    db.all(
      `SELECT * FROM monitor WHERE url = "${monitor.url}"`,
      (error, row) => {
        if (error) {
          throw new Error(error.message);
        }

        if (row.length > 0) {
          let setQuery = "";

          for (const key in monitor) {
            setQuery += `${key} = "${monitor[key]}", `;
          }

          sql = `UPDATE monitor
            SET ${setQuery.substring(0, setQuery.length - 2)} 
            WHERE url = "${monitor.url}"`;

          db.run(sql, (err) => {
            if (err) throw err;
            console.log(`${monitor.url} updated`);
          });
        } else {
          let columnQuery = Object.keys(monitor).join(", ");
          let valuesQuery = Object.values(monitor)
            .map((column) => `"${column}"`)
            .join(", ");

          sql = `INSERT INTO monitor
            (
              ${columnQuery}
            )
            VALUES (
              ${valuesQuery}
            )`;

          db.run(sql, (err) => {
            if (err) throw err;
            console.log(`${monitor.url} inserted`);
          });
        }
      }
    );
  });
}

syncMonitor();
