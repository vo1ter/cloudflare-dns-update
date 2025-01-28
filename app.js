require('dotenv').config()

async function updateDNS() {
    const dnsRecord = await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.ZONE_ID}/dns_records/${process.env.DNS_RECORD_ID}`, {
        method: 'GET',
        headers: {
            'X-Auth-Email': process.env.CLOUDFLARE_EMAIL,
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        return response.json();
    })
    .catch(error => {
        if(process.env.ENABLE_TELEGRAM_NOTIFICATIONS == 1) sendTelegramNotification(`🟧CLOUDFLARE:\n🟥Error during DNS record fetch: ${error}`)
        return response.json();
    });

    if(!dnsRecord.success) return;

    const externalIP = await fetch('https://ifconfig.me/all.json')
    .then(response => {
        return response.json();
    })
    .catch(error => {
        if(process.env.ENABLE_TELEGRAM_NOTIFICATIONS == 1) sendTelegramNotification(`🟧CLOUDFLARE:\n🟥Error during external IP fetch: ${error}`)
        return response.json();
    });

    if(externalIP.ip_addr == dnsRecord.result.content) return;

    if(process.env.ENABLE_TELEGRAM_NOTIFICATIONS == 1) sendTelegramNotification(`🟧CLOUDFLARE:\n🟩IPv4 changed from ${dnsRecord.result.content} to ${externalIP.ip_addr}`)

    await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.ZONE_ID}/dns_records/${process.env.DNS_RECORD_ID}`, {
        method: 'PATCH',
        headers: {
            'X-Auth-Email': process.env.CLOUDFLARE_EMAIL,
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "content": externalIP.ip_addr
        })
    })
    .then(response => {
        return response.json();
    })
    .catch(error => {
        if(process.env.ENABLE_TELEGRAM_NOTIFICATIONS == 1) sendTelegramNotification(`🟧CLOUDFLARE:\n🟥Error during DNS record update: ${error}`)
        return response.json();
    });
}

async function sendTelegramNotification(message) {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "chat_id": process.env.TELEGRAM_CHAT_ID,
            "text": message
        })
    })
    .then(response => {
        return response.json();
    })
    .catch(error => {
        console.log(error)
        return response.json();
    });

    return response
}

updateDNS()
setInterval(() => updateDNS(), process.env.FETCH_INTERVAL)