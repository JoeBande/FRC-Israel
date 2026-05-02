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
            axios.get(`https://www.thebluealliance.com/api/v3/event/${div}/alliances`, { headers: { 'X-TBA-Auth-Key': TBA_KEY } })
            .catch(() => null)
        );

        const responses = await Promise.all(requests);

        responses.forEach((response, index) => {
            if (response && response.data) {
                const divName = DIVISIONS[index].replace('2026', '').toUpperCase();
                response.data.forEach((alliance, allianceIdx) => {
                    // בדיקה אם אחת הקבוצות הישראליות נמצאת בתוך הברית הזו
                    const israeliInAlliance = alliance.picks.filter(teamKey => ISRAELI_TEAMS.includes(teamKey));
                    
                    if (israeliInAlliance.length > 0) {
                        playoffAlliances.push({
                            division: divName,
                            allianceNum: allianceIdx + 1,
                            name: alliance.name || `Alliance ${allianceIdx + 1}`,
                            picks: alliance.picks.map(key => key.replace('frc', '')),
                            israeliTeams: israeliInAlliance.map(key => TEAM_NAMES[key.replace('frc', '')] || key.replace('frc', '')),
                            status: alliance.status ? alliance.status.level : "ממתין לתחילת הפלייאוף"
                        });
                    }
                });
            }
        });

        res.send(`
            <dir dir="rtl" style="font-family: sans-serif; padding: 20px; background-color: #f0f2f5;">
                <h1 style="text-align: center; color: #d35400;">לוח פלייאוף - נציגות ישראלית בבריתות</h1>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    ${playoffAlliances.map(a => `
                        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-top: 5px solid #d35400;">
                            <h2 style="margin-top: 0;">${a.division} - ברית ${a.allianceNum}</h2>
                            <p><strong>נציגות שלנו:</strong> <span style="color: #27ae60; font-size: 1.2em;">${a.israeliTeams.join(', ')}</span></p>
                            <hr>
                            <p><strong>הרכב הברית המלא:</strong></p>
                            <ul style="list-style: none; padding: 0;">
                                ${a.picks.map((p, i) => `<li style="padding: 5px 0;">${i+1}. קבוצה ${p} ${TEAM_NAMES[p] ? `(${TEAM_NAMES[p]})` : ''}</li>`).join('')}
                            </ul>
                            <div style="background: #eee; padding: 10px; border-radius: 5px; text-align: center; font-weight: bold;">
                                סטטוס: ${a.status}
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${playoffAlliances.length === 0 ? '<p style="text-align: center;">ממתין לסיום בחירת הבריתות ביוסטון...</p>' : ''}
                <p style="text-align: center; margin-top: 30px;"><a href="/" style="text-decoration: none; color: #3498db;">רענן לנתונים מעודכנים</a></p>
            </dir>
        `);
    } catch (e) { res.status(500).send("שגיאה: " + e.message); }
});

app.listen(port, () => console.log(`Playoff server running on port ${port}`));