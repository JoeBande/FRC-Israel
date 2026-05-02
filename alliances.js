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
                    const allianceName = `Alliance ${allianceIdx + 1}`;
                    const israeliInAlliance = alliance.picks.filter(teamKey => ISRAELI_TEAMS.includes(teamKey));
                    
                    if (israeliInAlliance.length > 0) {
                        // חישוב תוצאות פלייאוף לברית
                        const allianceMatches = matches.filter(m => 
                            m.alliances.red.team_keys.includes(alliance.picks[0]) || 
                            m.alliances.blue.team_keys.includes(alliance.picks[0])
                        );

                        let wins = 0;
                        let losses = 0;
                        allianceMatches.forEach(m => {
                            if (m.winning_alliance) {
                                const isRed = m.alliances.red.team_keys.includes(alliance.picks[0]);
                                if ((isRed && m.winning_alliance === 'red') || (!isRed && m.winning_alliance === 'blue')) {
                                    wins++;
                                } else {
                                    losses++;
                                }
                            }
                        });

                        playoffAlliances.push({
                            division: divName,
                            allianceNum: allianceIdx + 1,
                            picks: alliance.picks.map(key => key.replace('frc', '')),
                            israeliTeams: israeliInAlliance.map(key => TEAM_NAMES[key.replace('frc', '')] || key.replace('frc', '')),
                            record: `${wins} ניצחונות - ${losses} הפסדים`,
                            status: alliance.status ? alliance.status.level : "בתחרות"
                        });
                    }
                });
            }
        });

        res.send(`
            <dir dir="rtl" style="font-family: sans-serif; padding: 20px; background-color: #f0f2f5;">
                <h1 style="text-align: center; color: #d35400;">מעקב פלייאוף בזמן אמת - ישראליות ביוסטון</h1>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
                    ${playoffAlliances.map(a => `
                        <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); border-right: 8px solid #d35400;">
                            <h2 style="margin: 0 0 10px 0; color: #2c3e50;">${a.division} - ברית ${a.allianceNum}</h2>
                            <p style="font-size: 1.1em;"><strong>הקבוצות שלנו:</strong> <span style="color: #c0392b;">${a.israeliTeams.join(', ')}</span></p>
                            <div style="background: #e8f4fd; padding: 10px; border-radius: 6px; margin: 15px 0; text-align: center; font-size: 1.2em; font-weight: bold; color: #2980b9;">
                                מאזן פלייאוף: ${a.record}
                            </div>
                            <p style="margin-bottom: 5px;"><strong>הרכב ברית:</strong> ${a.picks.join(' | ')}</p>
                            <div style="font-size: 0.9em; color: #7f8c8d; text-align: left;">Status: ${a.status}</div>
                        </div>
                    `).join('')}
                </div>
                <p style="text-align: center; margin-top: 30px;"><button onclick="location.reload()" style="padding: 10px 20px; font-size: 1em; cursor: pointer; background: #d35400; color: white; border: none; border-radius: 5px;">רענן תוצאות</button></p>
            </dir>
        `);
    } catch (e) { res.status(500).send("שגיאה בעדכון התוצאות"); }
});

app.listen(port, () => console.log(`Playoff server running`));
