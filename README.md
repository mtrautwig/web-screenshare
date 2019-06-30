Web-based Screen Sharing
========================

This is a prototype for sending a Desktop screen to our [Samsung Smart TV](https://developer.samsung.com/tv/develop/specifications/general-specifications). It uses the following technologies:

  * _Media Capture_ and _MediaStream Recording_ to get an image stream from the Desktop and record it as WebM video
  * _Sockets.io_ and a small _NodeJS_ server to transport video data from the Desktop to the TV (as the latter does not support WebRTC yet)
  * _Media Source Extensions (MSE)_ on the TV to feed the video data into a `<video>` HTML element

Setup
-----

Media Capture mandates HTTPS in order to capture the desktop. So first, create a private key and self-signed certificate:

```
# openssl genrsa -out key.pem
# openssl req -new -x509 -key key.pem -out cert.pem -subj "/CN=localhost/" -days +365
```

Replace "localhost" with your server name or IP address.

Run
---

```$ nodejs index.js```

Then direct both your Browser on your Desktop system and the Browser on the Smart TV to:\
https://localhost:3000/

(again replace "localhost" like above)