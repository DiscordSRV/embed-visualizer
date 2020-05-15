export default {
  name: "DiscordSRV (YAML)",
  language: "yml",

  generateFrom(data) {
    const result = [];

    result.push(`MinecraftPlayer...Message:`);
    result.push(`  Enabled: true`);
    result.push(`  Webhook:`);
    result.push(`    Enable: false`);
    result.push(`    AvatarUrl: "%botavatarurl%"`);
    result.push(`    Name: "%botname%"`);
    result.push(`  Content: ${data.content ? JSON.stringify(data.content) : data.content}`);
    result.push(`  Embed:`);
    result.push(`    Color: ${data.embed.color ? data.embed.color : ""}`);
    result.push(`    Author:`);
    result.push(`      ImageUrl: ${data.embed.image.url ? JSON.stringify(data.embed.image.url) : ""}`);
    result.push(`      Name: ${data.embed.author.name ? JSON.stringify(data.embed.author.name) : ""}`);
    result.push(`      Url: ${data.embed.author.url ? JSON.stringify(data.embed.author.url) : ""}`);
    result.push(`    ThumbnailUrl: ${data.embed.thumbnail.url ? JSON.stringify(data.embed.thumbnail.url) : ""}`);
    result.push(`    Title:`);
    result.push(`      Text: ${data.embed.title ? JSON.stringify(data.embed.title) : ""}`);
    result.push(`      Url: ${data.embed.url ? JSON.stringify(data.embed.url) : ""}`);
    result.push(`    Description: ${data.embed.description ? JSON.stringify(data.embed.description) : ""}`);

    if (data.embed.fields) {
      const temp = [];
      for (const field of data.embed.fields) {
        const name = field.name ? JSON.stringify(field.name) : "";
        const value = field.value ? JSON.stringify(field.value) : "";
        const inline = field.inline !== undefined ? field.inline.toString() : `true`;
        temp.push(`${name};${value}${field.inline?`;${inline}`:""}`);
      }
      result.push(`    Fields: [${temp.join(', ')}]`);
    }

    result.push(`    ImageUrl: ${data.embed.image.url ? JSON.stringify(data.embed.image.url) : ""}`);
    result.push(`    Footer:`);
    result.push(`      Text: ${data.embed.footer.text ? JSON.stringify(data.embed.footer.text) : ""}`);
    result.push(`      IconUrl: ${data.embed.footer.icon_url ? JSON.stringify(data.embed.footer.icon_url) : ""}`);
    result.push(`    Timestamp: ${data.embed.timestamp ? JSON.stringify(data.embed.timestamp) : false}`);
    
    return result.join('\n');
  }
};
