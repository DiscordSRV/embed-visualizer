import React from 'react';
import { SketchPicker } from 'react-color';

import Button from './button';
import ModalContainer from './modalcontainer';
import AboutModal from './aboutmodal';
import CodeModal from './codemodal';
//import WarningModal from './warningmodal';
import CodeMirror from './codemirror';
import DiscordView from './discordview';

import Ajv from 'ajv';
import {
  customMessageSchema,
//  botMessageSchema,
//  webhookMessageSchema,
  registerKeywords,
  stringifyErrors,
} from '../validation';

import {
  extractRGB,
  combineRGB,
} from '../color';

import yaml from 'js-yaml';

const ajv = registerKeywords(new Ajv({ allErrors: true }));
const validators = {
//  regular: ajv.compile(botMessageSchema),
//  webhook: ajv.compile(webhookMessageSchema),
  custom: ajv.compile(customMessageSchema)
};

function FooterButton(props) {
  return <Button {...props} className='shadow-1 shadow-hover-2 shadow-up-hover' />;
}

const initialContent = 'this `supports` __a__ **subset** *of* ~~markdown~~ 😃 ```js\nfunction foo(bar) {\n  console.log(bar);\n}\n\nfoo(1);```';
const initialColor = Math.floor(Math.random() * 0xFFFFFF);

// this is just for convenience.
// TODO: vary this more?
const initialCode = yaml.dump({
  Option: {
    Enabled: true,
    Webhook: {
      Enable: false,
      AvatarUrl: "%botavatarurl%",
      Name: "%botname%"
    },
    Content: initialContent,
    Embed: {
      Enabled: true,
      Color: "#00ff00",
      Author: {
        ImageUrl: "%embedavatarurl%",
        Name: "%username% joined the server",
        Url: ""
      },
      ThumbnailUrl: "",
      Title: {
        Text: "",
        Url: ""
      },
      Description: "",
      Fields: [],
      ImageUrl: "",
      Footer: {
        Text: "",
        IconUrl: ""
      },
      Timestamp: false
    }
  }
}, {flowLevel: 4, quotingType: "\""});

// const webhookExample = yaml.safeDump({
//   content: `${initialContent}\nWhen sending webhooks, you can have [masked links](https://discordapp.com) in here!`,
//   embeds: [
//     initialEmbed,
//     {
//       title: 'Woah',
//       description: 'You can also have multiple embeds!\n**NOTE**: The color picker does not work with multiple embeds (yet).'
//     },
//   ]
// }, null, '  ');

const App = React.createClass({
  // TODO: serialize input, webhookMode, compactMode and darkTheme to query string?

  getInitialState() {
    return {
      webhookMode: false,
      compactMode: false,
      darkTheme: true,
      currentModal: null,
      input: initialCode,
      data: {},
      error: null,
      colorPickerShowing: false,
      embedColor: extractRGB(initialColor),

      // TODO: put in local storage?
//      webhookExampleWasShown: false,
    };
  },

  recursivelyMap(mappings, input, output) {
    for (let key in mappings) {
      if (!Object.prototype.hasOwnProperty.call(mappings, key)) continue;

      let mapping = mappings[key];
      let value = input[key];

      if (typeof mapping === "string") {
        if (key === "Timestamp" && typeof value === "boolean") {
          if (!value) {
            // skip false
            continue;
          }
          value = Date.now(); // current time
        }
        if (key === "Color" && typeof value === "string") {
          // hex to int
          let rrggbb = value.substring(1);
          const bbggrr = rrggbb.substr(4, 2) + rrggbb.substr(2, 2) + rrggbb.substr(0, 2);
          value = parseInt(bbggrr, 16);
        }
        if (key === "Fields") {
          let newFields = [];
          for (let field in value) {
            if (!Object.prototype.hasOwnProperty.call(mappings, key)) continue;

            if (field.equals("blank")) {
              // not supported :shrug:
            }

            let parts = field.split(";");
            if (parts.length < 2) {
              continue; // dum
            }

            let inline = parts.length < 3 || parts[2].equals("true");
            newFields.push({name: parts[0], value: parts[1], inline: inline});
          }
          value = newFields;
        }

        if (mapping.indexOf(".") !== -1) {
          let parts = mapping.split(".");
          let last = output;
          for (let i = 0; i < parts.length - 1; i++) {
            let current = last[parts[i]];
            if (current === undefined) {
              last[parts[i]] = {};
              last = last[parts[i]];
            } else {
              last = current;
            }
          }
          last[parts[parts.length - 1]] = value;
        } else {
          output[mapping] = value;
        }
      } else {
        this.recursivelyMap(mapping, value, output);
      }
    }
  },

  reverseMap(map, output, prefix) {
    for (let key in map) {
      if (!Object.prototype.hasOwnProperty.call(map, key)) continue;

      let value = map[key];
      if (typeof value === "string") {
        output[value] = prefix + key;
      } else {
        this.reverseMap(map[key], output, prefix + key + ".");
      }
    }

    return output;
  },

  validateInput(input, webhookMode) {
    const validator = validators.custom;

    let parsed;
    let isValid = false;
    let error = '';

    let mapped = {};
    try {
      parsed = yaml.load(input);
      webhookMode = typeof parsed.Option.Webhook.Enable === "boolean" ? parsed.Option.Webhook.Enable : webhookMode;

      let yamlToJsonMap = {
        Option: {
          Webhook: {
            AvatarUrl: "avatar_url",
            Name: "username"
          },
          Content: "content",
          Embed: {
            Color: "embed.color",
            Author: {
              ImageUrl: "embed.author.icon_url",
              Name: "embed.author.name",
              Url: "embed.author.url"
            },
            ThumbnailUrl: "embed.thumbnail.url",
            Title: {
              Text: "embed.title",
              Url: "embed.url"
            },
            Description: "embed.description",
            Fields: "embed.fields",
            ImageUrl: "embed.image.url",
            Footer: {
              Text: "embed.footer.text",
              IconUrl: "embed.footer.icon_url"
            },
            Timestamp: "embed.timestamp"
          }
        }
      }
      this.recursivelyMap(yamlToJsonMap, parsed, mapped);

      let jsonToYamlMap = this.reverseMap(yamlToJsonMap, {}, "");

      isValid = validator(mapped);
      if (!isValid) {
        error = stringifyErrors(jsonToYamlMap, mapped, validator.errors);
      }
    } catch (e) {
      error = e.message;
    }

    let data = isValid ? mapped : this.state.data;

    let embedColor = { r: 0, g: 0, b: 0 };
    if (webhookMode && isValid && data.embeds && data.embeds[0]) {
      embedColor = extractRGB(data.embeds[0].color);
    } else if (!webhookMode && isValid && data.embed) {
      embedColor = extractRGB(data.embed.color);
    }

    // we set all these here to avoid some re-renders.
    // maybe it's okay (and if we ever want to
    // debounce validation, we need to take some of these out)
    // but for now that's what we do.
    this.setState({ input, data, error, webhookMode, embedColor });
  },

  componentWillMount() {
    this.validateInput(this.state.input, this.state.webhookMode);
  },

  onCodeChange(value, change) {
    // for some reason this fires without the value changing...?
    if (value !== this.state.input) {
      this.validateInput(value, this.state.webhookMode);
    }
  },

  openAboutModal() {
    this.setState({ currentModal: AboutModal });
  },

  openCodeModal() {
    this.setState({ currentModal: CodeModal });
  },

  closeModal() {
    this.setState({ currentModal: null });
  },

  // toggleWebhookMode() {
  //   if (!this.state.webhookExampleWasShown) {
  //     this.setState({ currentModal: WarningModal });
  //   } else {
  //     this.validateInput(this.state.input, !this.state.webhookMode);
  //   }
  // },
  //
  // displayWebhookExample() {
  //   this.setState({ currentModal: null, webhookExampleWasShown: true });
  //   this.validateInput(webhookExample, true);
  // },
  //
  // dismissWebhookExample() {
  //   this.setState({ currentModal: null, webhookExampleWasShown: true });
  //   this.validateInput(this.state.input, true);
  // },

  toggleTheme() {
    this.setState({ darkTheme: !this.state.darkTheme });
  },

  toggleCompactMode() {
    this.setState({ compactMode: !this.state.compactMode });
  },
  
  openColorPicker() {
    this.setState({ colorPickerShowing: !this.state.colorPickerShowing });
  },
  
  colorChange(color) {
    let val = combineRGB(color.rgb.r, color.rgb.g, color.rgb.b);
    if (val === 0) val = 1; // discord wont accept 0
    const input = this.state.input.replace(/color\s*:\s*([0-9]+)/, 'color: ' + val);
    this.validateInput(input, this.state.webhookMode);
  },

  render() {
//    const webhookModeLabel = `${this.state.webhookMode ? 'Dis' : 'En'}able webhook mode`;
    const themeLabel = `${this.state.darkTheme ? 'Light' : 'Dark'} theme`;
    const compactModeLabel = `${this.state.compactMode ? 'Cozy' : 'Compact'} mode`;
    const colorPickerLabel = `${!this.state.colorPickerShowing ? 'Open' : 'Close'} color picker`;

    const colorPicker = this.state.colorPickerShowing ? (
      <div style={{
        position: 'absolute',
        bottom: '45px',
        marginLeft: '-25px',
      }}>
        <SketchPicker
          color={this.state.embedColor}
          onChange={this.colorChange}
          disableAlpha={true}
        />
      </div>
    ) : null;
    
    return (
      <main className='vh-100-l bg-blurple open-sans'>

        <div className='h-100 flex flex-column'>
          <section className='flex-l flex-auto'>
            <div className='vh-100 h-auto-l w-100 w-50-l pa4 pr3-l pb0-l'>
              <CodeMirror
                onChange={this.onCodeChange}
                value={this.state.input}
                theme={this.state.darkTheme ? 'one-dark' : 'default'}
              />
            </div>
            <div className='vh-100 h-auto-l w-100 w-50-l pa4 pl3-l pb0'>
              <DiscordView
                data={this.state.data}
                error={this.state.error}
                webhookMode={this.state.webhookMode}
                darkTheme={this.state.darkTheme}
                compactMode={this.state.compactMode}
                username={this.state.webhookMode ? this.state.data.username : undefined}
                avatar_url={this.state.webhookMode ? this.state.data.avatar_url : undefined}
              />
            </div>
          </section>

          <footer className='w-100 pa3 tc white'>
            <FooterButton label='Generate code' onClick={this.openCodeModal} />
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <FooterButton label={colorPickerLabel} onClick={this.openColorPicker} />
              {colorPicker}
            </div>
            {/* <FooterButton label={webhookModeLabel} onClick={this.toggleWebhookMode} /> */}
            <FooterButton label={themeLabel} onClick={this.toggleTheme} />
            <FooterButton label={compactModeLabel} onClick={this.toggleCompactMode} />
            <FooterButton label='About' onClick={this.openAboutModal} />
          </footer>
        </div>

        <ModalContainer
          yes={this.displayWebhookExample}
          no={this.dismissWebhookExample}
          close={this.closeModal}
          data={this.state.data}
          webhookMode={this.state.webhookMode}
          darkTheme={this.state.darkTheme}
          hasError={this.state.error !== null && this.state.error !== ''}
          currentModal={this.state.currentModal}
        />
      </main>
    );
  },
});


export default App;
