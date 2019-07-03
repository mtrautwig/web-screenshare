Web-based Digital Signage
=========================

This is a prototype for getting content on the [Samsung Smart TV](https://developer.samsung.com/tv/develop/specifications/general-specifications)
in our office room. This screen has a built-in Web Browser based on a somewhat usable Chromium version.

This web site can run on as many screens as you like (eg for remote collaboration), one serves as a control terminal. Commands to show content are
sent via WebSockets from the control terminal to the WebSockets server, which broadcasts them to all other screens. Following content is supported, either by dragging or pasting it into the Browser:

* Images. Use Firefox' built-in Screenshot tool to project a screen on the displays.
* HTML snippets if you want some dynamic content.
* URLs to show things reachable via the public Internet (though somewhat limited, because cross-origin embedding is usually disabled).

Run
---

You need a NodeJS server which all screens connect to:

```$ nodejs index.js```

Then direct both your Browser on your Desktop system and the Browser on the Smart TV to:\
https://localhost:3000/

(replace "localhost" with a URL which both browsers can reach)