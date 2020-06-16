/* eslint-disable no-loop-func */
const puppeteer = require('puppeteer');


async function master(url) {
    const browser = await puppeteer.launch( {args: ['--no-sandbox', '--disable-setuid-sandbox'],  headless: true,}
    );
    const page = await browser.newPage();
    await page.goto(url);
    //const hrefs = await page.$$eval('a', links => links.map(a => a.href));
    let div_selector= "#upcoming_events_card"; 
    const elements = await page.$(div_selector);
    //const divs = await page.evaluate(() => document.querySelector('#upcoming_events_card').textContent);
    const links =  await elements.$$eval('a', links => links.map(a => a.href));
    linksIncluded =[]
    for(let i=0; i<links.length; i+=1) {
        if (links[i].includes('events')) {
            linksIncluded.push(links[i])
        }
    }
    div_selector= "#recurring_events_card"; 
    const elementsreo = await page.$(div_selector);
    //const divs = await page.evaluate(() => document.querySelector('#upcoming_events_card').textContent);
    const linksreo =  await elementsreo.$$eval('a', links => links.map(a => a.href));
    for(let i=0; i<linksreo.length; i+=1) {
        if (linksreo[i].includes('events')) {
            linksIncluded.push(linksreo[i])
        }
    }

    const linksInclude = [...new Set(linksIncluded)];

    jsonOut=[]
    let jsonScript
    for(let j=0; j<linksInclude.length; j+=1) {
        // eslint-disable-next-line no-await-in-loop
        await page.goto(linksInclude[j])
        // eslint-disable-next-line no-await-in-loop
       try {
        const script = await page.evaluate(() => document.querySelector('head > script:nth-child(12)').textContent);
        jsonScript = JSON.parse(script)
        // eslint-disable-next-line no-await-in-loop
        let people
        try{
            people = await page.evaluate(() => document.querySelector('head > meta:nth-child(13)').content);
        } catch {
            people=''
        }
        //people.split(' people')
        let peps
        try {
            peps=people.split(' people')[1].replace( /^\D+/g, '');
        } catch (err) {
            peps='None'
        }
        jsonScript['peopleNum'] = peps
        jsonOut.push(jsonScript)
       } catch(err) {
           let name
        try{ 
            name = await page.evaluate(() => document.querySelector('#seo_h1_tag').textContent);
        } catch {
            name=''
        }
        let startDate
        try{
            startDate = await page.evaluate(() => document.querySelector('._2ycp._5xhk').getAttribute('content').split(' to ')[0]);
        } catch(err) {
            startDate=""
        }
        let endDate
        try{
            endDate = await page.evaluate(() => document.querySelector('._2ycp._5xhk').getAttribute('content').split(' to ')[1]);
        } catch(err) {
            endDate=""
        }
        let description
        try {
            description = await page.evaluate(() => document.querySelector('._63ew > span:nth-child(1)').innerText);
        } catch (err) {
            try{ 
                description = await page.evaluate(() => document.querySelector('._63ew > span:nth-child(1)').innerText);
            } catch {
                description=''
            }
        }
        let locationName
        try{
            locationName = await page.evaluate(() => document.querySelector('#u_0_k').textContent);
        } catch (err) {
            locationName=''
        }
        jsonScript = {
            'name': name,
            'startDate': startDate,
            'endDate': endDate,
            'description': description,
            'location': {'name': locationName},
            'url' : linksInclude[j]
        }
        if (jsonScript.name==="" && jsonScript.description==="") {
            continue
        } else {
            jsonOut.push(jsonScript)
        }
       }
    }
    
    await browser.close()
    console.log(jsonOut)
    return jsonOut
}


master('https://www.facebook.com/LBSBaltimore/events/?ref=page_internal')
