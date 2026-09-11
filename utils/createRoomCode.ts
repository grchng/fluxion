export function createRoomCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < 6; index++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}
