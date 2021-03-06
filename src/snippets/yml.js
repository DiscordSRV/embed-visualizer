export default {
  name: "DiscordSRV (YAML)",
  language: "yml",

  generateFrom(data, webhookMode) {
    const result = [];

    result.push(`MinecraftPlayer...Message:`);
    result.push(`  Enabled: true`);
    result.push(`  Webhook:`);
    result.push(`    Enable: ` + webhookMode);
    result.push(`    AvatarUrl: "%botavatarurl%"`);
    result.push(`    Name: "%botname%"`);
    result.push(`  Content: ${this.stringify(data.content)}`);
    result.push(`  Embed:`);
    result.push(`    Color: ${data.embed.color ? data.embed.color : "#ffffff"}`);
    result.push(`    Author:`);
    result.push(`      ImageUrl: ${this.stringify(data.embed.image.url)}`);
    result.push(`      Name: ${this.stringify(data.embed.author.name)}`);
    result.push(`      Url: ${this.stringify(data.embed.author.url)}`);
    result.push(`    ThumbnailUrl: ${this.stringify(data.embed.thumbnail.url)}`);
    result.push(`    Title:`);
    result.push(`      Text: ${this.stringify(data.embed.title)}`);
    result.push(`      Url: ${this.stringify(data.embed.url)}`);
    result.push(`    Description: ${this.stringify(data.embed.description)}`);

    if (data.embed.fields) {
      const temp = [];
      for (const field of data.embed.fields) {
        const name = field.name ? this.stringify(field.name) : "";
        const value = field.value ? this.stringify(field.value) : "";
        const inline = field.inline !== undefined ? field.inline.toString() : `true`;
        temp.push(`${name};${value}${field.inline?`;${inline}`:""}`);
      }
      result.push(`    Fields: [${temp.join(', ')}]`);
    }

    result.push(`    ImageUrl: ${this.stringify(data.embed.image.url)}`);
    result.push(`    Footer:`);
    result.push(`      Text: ${this.stringify(data.embed.footer.text)}`);
    result.push(`      IconUrl: ${this.stringify(data.embed.footer.icon_url)}`);
    result.push(`    Timestamp: ${data.embed.timestamp ? this.stringify(data.embed.timestamp) : "false"}`);
    
    return result.join('\n');
  },

  stringify(value) {
    if (value === "") {
      return "\"\"";
    }

    return JSON.stringify(value);
  }
};
