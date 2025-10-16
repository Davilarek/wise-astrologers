class HommMessageGeneratorDispatcher {
  constructor() {
    this.canvas = document.getElementById("canvas");
    this.context = this.canvas.getContext("2d");
    this.langSelect = document.getElementById("lang");
    this.fetchButton = document.getElementById("fetch");
    this.input = document.getElementById("input");

    this.homm3 = new Homm3MessageGenerator(this);
    this.homm2 = new Homm2MessageGenerator(this);
    this.renderer = null;

    this.color = "red";
    this.buttons_show = { ok: true, cancel: false };
    this.draw_shadow = false;
    this.split_words = [];

    this.setRenderer("homm3");

    this.initControls();

    // fetch initial proclamation
    this.fetchProclamation();
  }

  setRenderer(type) {
    if (!type.match(/^homm[23]$/)) return;
    if (this.renderer) this.renderer.is_current_renderer = false;

    this.renderer = this[type];
    this.renderer.is_current_renderer = true;
    this.renderer.render();

    document.body.classList.remove("homm2", "homm3");
    document.body.classList.add(type);
  }

  async fetchProclamation() {
    const lang = this.langSelect?.value || "en";
    const url = `https://wise-astrologers.davilareko.workers.dev/?lang=${lang}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      const text = `${data.title}\n\n${data.effect}\n\n${data.dwellingsStatusEffect}`;
      this.input.value = text;

      this.render();
    } catch (err) {
      console.error("Failed to fetch proclamation:", err);
      this.input.value = "⚠️ Failed to fetch prophecy from the stars...";
      this.render();
    }
  }

  isButtonsVisible() {
    return this.buttons_show.ok || this.buttons_show.cancel;
  }
  render() {
    this.breakInputIntoWordsAndSpaces();
    if (this.renderer) this.renderer.render();
  }

  initControls() {
    document.querySelectorAll(".color-item").forEach(el => {
      el.addEventListener("click", () => this.setColor(el.dataset.color));
    });

    document.querySelectorAll(".checkbox-wrapper input").forEach(el => {
      el.addEventListener("change", () => this.toggleCheckbox(el));
    });

    document.querySelectorAll(".input-wrapper-homm2-theme input").forEach(el => {
      el.addEventListener("change", () => this.homm2.setTheme(el.value));
    });

    document.querySelectorAll(".radios-wrapper-style input").forEach(el => {
      el.addEventListener("change", () => this.setRenderer(el.value));
    });

    if (this.fetchButton) {
      this.fetchButton.addEventListener("click", () => this.fetchProclamation());
    }

    document.querySelector(".download-button").addEventListener("mousedown", this.prepareCurrentImageDownload.bind(this));
  }

  setColor(color) {
    document.querySelectorAll(".color-item").forEach(el => el.classList.remove("selected"));
    document.querySelector(`.color-item[data-color='${color}']`)?.classList.add("selected");
    this.color = color;
    this.render();
  }

  toggleCheckbox(checkbox) {
    const name = checkbox.name;
    if (name === "shadow") {
      this.draw_shadow = checkbox.checked;
    } else {
      this.buttons_show[name] = checkbox.checked;
    }
    this.render();
  }

  prepareCurrentImageDownload() {
    const link = document.querySelector(".download-button");
    const now = Date.now();
    link.download = `HoMM3-message-${now}.png`;
    link.href = this.canvas.toDataURL();
  }

  breakInputIntoWordsAndSpaces() {
    const value = this.getInputValue();
    const out = [];
    let currentType = "", currentSeq = "";

    for (let i = 0; i < value.length; i++) {
      const c = value[i];
      let type = /\s/.test(c) ? (/\r|\n/.test(c) ? "break" : "space") : "symbol";
      if (type !== currentType) {
        if (currentSeq) out.push(currentSeq);
        currentType = type;
        currentSeq = "";
      }
      currentSeq += c;
      if (type === "break") {
        out.push(c);
        currentSeq = "";
      }
    }
    if (currentSeq) out.push(currentSeq);
    this.split_words = out;
  }

  getInputValue() {
    return this.input.value;
  }

  getCharInfo(object, char) {
    const info = object.letters[char];
    if (!info) return null;
    if (info.same_as) return object.letters[info.same_as];
    return info;
  }
}
