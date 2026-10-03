async function bringCodeToLife(source) {
  const events = source.split("\n");
  for (const event of events) {
    if (event.includes("function")) {
      await playMelody(event);
    } else {
      pulse(event.length);
    }
  }
  return { soundtrack: "alive" };
}

bringCodeToLife(myCode);
