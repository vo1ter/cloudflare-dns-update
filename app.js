require('dotenv').config()

async function updateDNS() {
    const dnsRecord = await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.ZONE_ID}/dns_records/`, {
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
        if(process.env.ENABLE_TELEGRAM_NOTIFICATIONS == 1) sendTelegramNotification(`🟧 CLOUDFLARE:\n🟥 Error during DNS record fetch: ${error}`)
        return response.json();
    });

    if(!dnsRecord.success) return;

    const externalIP = await fetch('https://ifconfig.me/all.json')
    .then(response => {
        return response.json();
    })
    .catch(error => {
        if(process.env.ENABLE_TELEGRAM_NOTIFICATIONS == 1) sendTelegramNotification(`🟧 CLOUDFLARE:\n🟥 Error during external IP fetch: ${error}`)
        return response.json();
    });

    let namesToChange = [];
    let originalIps = [];

    dnsRecord.result.forEach(record => {
        if((process.env.NAMES_TO_CHANGE.replaceAll(" ", "").split(",")).includes(record.name) && record.content != externalIP.ip_addr) {
            namesToChange.push(record.id)
            originalIps.push(record.content)
        }
    })

    if(namesToChange.length == 0) return;

    const batchEdit = await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.ZONE_ID}/dns_records/batch`, {
        method: 'POST',
        headers: {
            'X-Auth-Email': process.env.CLOUDFLARE_EMAIL,
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "patches": namesToChange.map(id => ({id: id, content: externalIP.ip_addr}))
        })
    })
    .then(response => {
        return response.json();
    })
    .catch(error => {
        return response.json();
    });
    
    let changedNames = [];

    batchEdit.result.patches.forEach(patch => {
        changedNames.push(patch.name)
    })

    if(batchEdit.success && process.env.ENABLE_TELEGRAM_NOTIFICATIONS == 1) {
        changedNames.forEach((name, index) => {
            sendTelegramNotification(`🟧 CLOUDFLARE:\n🟩 Changed ${name} from ${originalIps[index]} to ${externalIP.ip_addr}`)
        })
    }
    else if(process.env.ENABLE_TELEGRAM_NOTIFICATIONS == 1) sendTelegramNotification(`🟧 CLOUDFLARE:\n🟥 Error during DNS record update: ${error}`);
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