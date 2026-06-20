import buffer from "buffer";

if (!buffer.SlowBuffer) {
  buffer.SlowBuffer = buffer.Buffer;
  console.log("Patched buffer.SlowBuffer for Node compatibility");
}
