import store from '../Store.js';

export default {
  props: {
    'name': String,
    'i': Number,
  },
  data() {
    const functionKey = store.get('groups.' + this.name + '.function');
    const paletteKey = store.get('groups.' + this.name + '.palette');
    return {
      functionKey,
      paletteKey,
      palette: store.getPalettes()[paletteKey],
    }
  },
  computed: {
    groups: function () {
      return store.get('groups');
    },
    functions: function () {
      return store.getFunctions();
    },
    palettes: function () {
      return store.getPalettes();
    },
  },
  methods: {
    updateFunction() {
      store.set('groups.' + this.name + '.function', this.functionKey);
    },
    updatePalette() {
      store.set('groups.' + this.name + '.palette', this.paletteKey);
      this.palette = this.palettes[this.paletteKey];
      this.drawPalettePreview();
      this.$nextTick(this.createColorPickers);
    },
    newPalette() {
      const newKey = Date.now();
      const newPalette = JSON.parse(JSON.stringify(this.palette));
      newPalette.name = this.palette.name + ' (Copy)';
      newPalette.default = false;
      store.setPalette(newKey, newPalette);
      this.paletteKey = newKey;
      this.updatePalette();
    },
    deletePalette() {
      if (confirm(`Delete palette "${this.palette.name}?"`)) {
        store.removePalette(this.paletteKey);
        this.paletteKey = 0;
        this.updatePalette();
      }
    },
    updatePaletteContents() {
      store.setPalette(this.paletteKey, this.palette);
      this.drawPalettePreview();
    },
    addColor(i) {
      this.palette.colors.splice(i + 1, 0, this.palette.colors[i].slice());
      this.updatePaletteContents();
      this.$nextTick(this.createColorPickers);
    },
    deleteColor(i) {
      if (this.palette.colors.length > 2) {
        this.palette.colors.splice(i, 1);
        this.updatePaletteContents();
        this.$nextTick(this.createColorPickers);
      }
    },
    drawPalettePreview() {
      const c = document.getElementById('palette-color-bar');
      const ctx = c.getContext('2d');
      c.width = 64;
      c.height = 1;
      const sectorSize = 1 / (this.palette.colors.length - 1);
      for (let i = 0; i < c.width; i++) {
        let f = i / c.width;
        const sector = Math.floor(f / sectorSize);
        f = f % sectorSize / sectorSize;
        const c1 = this.palette.colors[sector];
        const c2 = this.palette.colors[sector + 1];
        let h1 = c2[0] - c1[0];
        // Allow full spectrum if extremes are 0 and 1 in any order
        // otherwise pick shortest path between colors
        if (Math.abs(h1) != 1) {
          if (h1 < -0.5) h1++;
          if (h1 > 0.5) h1--;
        }
        const h = (f * h1 + c1[0]) * 360;
        const s = (f * (c2[1] - c1[1]) + c1[1]) * 100;
        const v = (f * (c2[2] - c1[2]) + c1[2]) * 100;
        const l = (2 - s / 100) * v / 2;
        const s2 = s * v / (l < 50 ? l * 2 : 200 - l * 2);
        ctx.fillStyle = `hsl(${h}, ${s}%, ${l}%)`
        ctx.fillRect(i, 0, 1, c.height);
      }
    },
    createColorPickers() {
      for (let i = 0; i < this.palette.colors.length; i++) {
        const pickr = Pickr.create({
          el: `#color-picker-${i}`,
          theme: 'classic',
          showAlways: true,
          inline: true,
          lockOpacity: true,
          comparison: false,
          default: `hsv(${this.palette.colors[i][0] * 360}, ${this.palette.colors[i][1] * 100}%, ${this.palette.colors[i][2] * 100}%)`,
          swatches: null,
          components: {
            preview: false,
            opacity: false,
            hue: true,
            interaction: { hex: true, rgba: true, hsla: true, hsva: true, input: true },
          },
        });
        pickr.index = i;
        if (!this.palette.default) {
          pickr.on('changestop', (c, instance) => {
            const color = instance.getColor();
            this.palette.colors[instance.index] = [
              color.h / 360, color.s / 100, color.v / 100
            ];
            this.updatePaletteContents();
          });
        }
      }
    }
  },
  mounted() {
    this.drawPalettePreview();
    this.$nextTick(this.createColorPickers);
  },
  template: `
    <h4>Group {{ i + 1 }} ({{ name }})</h4>
      <slider-number-input
        v-bind:path="'groups.' + name + '.brightness'"
        label="Brightness"
        unit=""
        v-bind:min="0"
        v-bind:max="1"
        v-bind:step="0.01"
      ></slider-number-input>
      <slider-number-input
        v-bind:path="'groups.' + name + '.color_temp'"
        label="Color Temp"
        unit="K"
        v-bind:min="1000"
        v-bind:max="12000"
        v-bind:step="10"
      ></slider-number-input>
      <slider-number-input
        v-bind:path="'groups.' + name + '.saturation'"
        label="Saturation"
        unit=""
        v-bind:min="0"
        v-bind:max="1"
        v-bind:step="0.01"
      ></slider-number-input>
      <div class="input-row input-row-top-margin input-toplevel">
        <span class="label select-label">Pattern:</span>
        <span class="select-container">
          <select
            class="update-on-change"
            autocomplete="off"
            v-model="functionKey"
            @change="updateFunction"
          >
            <option
              v-for="(f, id) in functions"
              v-bind:value="id"
            >
              {{ f.name }}
            </option>
          </select>
        </span>
      </div>
      <slider-number-input
        v-bind:path="'groups.' + name + '.speed'"
        label="Speed"
        unit="Hz"
        v-bind:min="0"
        v-bind:max="2"
        v-bind:step="0.01"
      ></slider-number-input>
      <slider-number-input
        v-bind:path="'groups.' + name + '.scale'"
        label="Scale"
        unit=""
        v-bind:min="-10"
        v-bind:max="10"
        v-bind:step="0.01"
      ></slider-number-input>
      <div class="input-row input-row-top-margin input-toplevel">
        <span class="label select-label">Palette:</span>
        <span class="select-container">
          <select
            class="update-on-change"
            autocomplete="off"
            v-model="paletteKey"
            @change="updatePalette"
          >
            <option
              v-for="(p, id) in palettes"
              v-bind:value="id"
            >
              {{ p.name }}
            </option>
          </select>
        </span>
      </div>
      <canvas id="palette-color-bar" style="display: block; border-radius: 3px; width: 100%; height: 0.7rem; margin-bottom: 0.5rem;"></canvas>
      <div id="colors">
        <div class="input-row input-row-bottom-margin">
          <a
            class="button"
            @click="newPalette"
          >New Palette</a>
          <a
            class="button"
            v-show="!palette.default"
            @click="deletePalette"
          >Delete</a>
          <input
            type="text"
            v-model="palette.name"
            @change="updatePaletteContents"
            v-bind:disabled="palette.default"
          >
        </div>
        <div id="color-picker-container">
          <div v-for="(color, i) in palette.colors" :key="paletteKey + '.' + palette.colors.length + '.' + i">
            <div class="input-row input-row-top-margin">
              <span class="label">Color {{ i + 1 }}:</span>
              <a
                class="button button-inline"
                v-show="!palette.default"
                @click="addColor(i)"
              >+</a>
              <a
                class="button button-inline"
                v-show="!palette.default"
                @click="deleteColor(i)"
              >-</a>
            </div>
            <span class="color-picker" v-bind:id="'color-picker-' + i"></span>
          </div>
        </div>
      </div>
  `,
};