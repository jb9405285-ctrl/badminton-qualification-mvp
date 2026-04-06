import { ensureDemoData } from "../lib/data/bootstrap";

async function main() {
  await ensureDemoData();
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
