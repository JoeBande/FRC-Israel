const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const TBA_KEY = 'tcSBGN2dh9kTZf2EdxWsMzLzBLQWxeuj51o9TcWiXC5PP2uNgFhg10ngfv5zpCZ7';

const ISRAELI_TEAMS = ['frc5987', 'frc1690', 'frc1577', 'frc7039', 'frc2231', 'frc3075', 'frc4590', 'frc5951', 'frc10935', 'frc2096', 'frc2630', 'frc3339'];
const TEAM_NAMES = {
    '5987': 'Galaxia', '1690': 'Orbit', '1577': 'Steampunk', '7039': 'XO',
    '2231': 'OnyxTronix', '3075': 'Ha-Dream Team', '4590': 'GreenBlitz',
    '5951': 'Makers Assemble', '10935': 'Krono', '2096': 'RoboActive', 
    '2630': 'Thunderbolts', '3339': 'BumbleB'
};
const DIVISIONS = ['2026new', '2026gal', '2026cur', '2026hop', '2026arc', '2026joh', '2026mil', '2026dal'];

app.get('/', async (req, res) => {
    try {
        let playoffAlliances = [];
        const requests = DIVISIONS.map(div => 
            Promise.all([
                axios.get(`https://www.thebluealliance.com/api/v3/event/${div}/alliances`, { headers: { 'X-TBA-Auth-Key': TBA_KEY } }),
                axios.get(`https://www.thebluealliance.com/api/v3/event/${div}/matches/simple`, { headers: { 'X-TBA-Auth-Key': TBA_KEY } })
            ]).catch(() => null)
        );

        const responses = await Promise.all(requests);

        responses.forEach((responseArr, index) => {
            if (responseArr && responseArr[0].data) {
                const alliances = responseArr[0].data;
                const matches = responseArr[1].data.filter(m => m.comp_level === 'sf' || m.comp_level === 'f');
                const divName = DIVISIONS[index].replace('2026', '').toUpperCase();

                alliances.forEach((alliance, allianceIdx) => {
                    const allianceNum = allianceIdx + 1;
                    const israeliInAlliance = alliance.picks.filter(teamKey => ISRAELI_TEAMS.includes(teamKey));
                    
                    if (israeliInAlliance.length > 0) {
                        const firstTeam = alliance.picks[0];
                        
                        // סינון משחקים שהסתיימו עבור הברית הזו
                        const allianceMatches = matches
                            .filter(m => m.alliances.red.team_keys.includes(firstTeam) || m.alliances.blue.team_keys.includes(firstTeam))
                            .filter(m => m.winning_alliance !== ""); // רק משחקים עם תוצאה

                        let matchResults = allianceMatches.map(m => {
                            const isRed = m.alliances.red.team_keys.includes(firstTeam);
                            const myScore = isRed ? m.alliances.red.score : m.alliances.blue.score;
                            const oppScore = isRed ? m.alliances.blue.score : m.alliances.red.score;
                            const resultEmoji = (isRed && m.winning_alliance === 'red') || (!isRed && m.winning_alliance === 'blue') ? '✅' : '❌';
                            
                            return `${resultEmoji} ${myScore}:${oppScore}`;
                        });

                        playoffAlliances.push({
                            division: divName,
                            allianceNum: allianceNum,
                            israeliTeams: israeliInAlliance.map(key => TEAM_NAMES[key.replace('frc', '')] || key.replace('frc', '')),
                            record: `${matchResults.filter(r => r.includes('✅')).length} נצ' - ${matchResults.filter(r => r.includes('❌')).length} הפס'`,
                            results: matchResults,
                            status: alliance.status ? alliance.status.level : "פעילה"
                        });
                    }
                });
            }
        });

        res.send(`
            <dir dir="rtl" style="font-family: sans-serif; padding: 20px; background-color: #f4f4f9;">
                <h1 style="text-align: center; color: #2c3e50;">תוצאות פלייאוף - נציגות ישראל</h1>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px;">
                    ${playoffAlliances.map(a => `
                        <div style="background: white; padding: 15px; border-radius: 12px; border-top: 6px solid #2980b9; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <h2 style="margin: 0;">${a.division} - ברית ${a.allianceNum}</h2>
                            <p style="color: #c0392b; font-weight: bold;">${a.israeliTeams.join(', ')}</p>
                            <div style="background: #2c3e50; color: white; padding: 8px; border-radius: 5px; text-align: center; margin: 10px 0;">
                                מאזן: ${a.record}
                            </div>
                            <p style="margin: 5px 0;"><strong>תוצאות משחקים:</strong></p>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                ${a.results.length > 0 ? a.results.map(r => `<li style="padding: 3px 0; font-family: monospace; font-size: 1.2em;">${r}</li>`).join('') : '<li>טרם שוחקו משחקים</li>'}
                            </ul>
                            <div style="margin-top: 10px; font-size: 0.8em; color: #95a5a6;">סטטוס: ${a.status}</div>
                        </div>
                    `).join('')}
                </div>
                <p style="text-align: center; margin-top: 20px;"><button onclick="location.reload()" style="padding: 10px 20px; background: #2980b9; color: white; border: none; border-radius: 5px; cursor: pointer;">רענן תוצאות</button></p>
            </dir>
        `);
    } catch (e) { res.status(500).send("שגיאה בטעינת התוצאות"); }
});

app.listen(port, () => console.log(`Playoff results server running`));
