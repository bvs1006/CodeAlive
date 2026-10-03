def compose_code(lines):
    melody = []
    for index, line in enumerate(lines):
        if line.strip():
            note = len(line) % 7
            melody.append((index, note))
    return melody

class Soundtrack:
    def play(self, melody):
        for beat, note in melody:
            print(f"Beat {beat}: {note}")

Soundtrack().play(compose_code(source))
