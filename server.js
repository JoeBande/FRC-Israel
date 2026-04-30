const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

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
        let allRankings = [];
        const requests = DIVISIONS.map(div => 
            axios.get(`https://www.thebluealliance.com/api/v3/event/${div}/rankings`, { headers: { 'X-TBA-Auth-Key': TBA_KEY } })
            .catch(() => null)
        );

        const responses = await Promise.all(requests);

        responses.forEach((response, index) => {
            if (response && response.data && response.data.rankings) {
                const divName = DIVISIONS[index].replace('2026', '').toUpperCase();
                response.data.rankings.forEach(team => {
                    if (ISRAELI_TEAMS.includes(team.team_key)) {
                        const teamNum = team.team_key.replace('frc', '');
                        const rpAvg = (team.extra_stats[0] / (team.matches_played || 1)).toFixed(2);

                        allRankings.push({
                            team: teamNum,
                            name: TEAM_NAMES[teamNum] || "Israel Team",
                            division: divName,
                            rank: team.rank,
                            rp: rpAvg,
                            record: team.record ? `${team.record.wins}-${team.record.losses}-${team.record.ties}` : "0-0-0"
                        });
                    }
                });
            }
        });

        allRankings.sort((a, b) => a.rank - b.rank);

        res.send(`
            <dir dir="rtl" style="font-family: sans-serif; padding: 20px; background-color: #f4f4f9;">
                <h2 style="text-align: center; color: #003366;">🇮🇱 ישראליות ביוסטון 2026 - טבלת דירוג</h2>
                <table border="1" style="width: 100%; border-collapse: collapse; background: white; text-align: center; border: 2px solid #003366;">
                    <tr style="background-color: #003366; color: white;">
                        <th style="padding: 12px;">קבוצה</th>
                        <th style="padding: 12px;">שם</th>
                        <th style="padding: 12px;">בית</th>
                        <th style="padding: 12px;">דירוג</th>
                        <th style="padding: 12px;">ממוצע RP</th>
                        <th style="padding: 12px;">מאזן (W-L-T)</th>
                    </tr>
                    ${allRankings.map(r => `
                        <tr style="${r.team === '5987' ? 'background-color: #fff9c4; font-weight: bold;' : ''}">
                            <td style="padding: 10px;">${r.team === '5987' ? '⭐ ' + r.team : r.team}</td>
                            <td>${r.name}</td>
                            <td>${r.division}</td>
                            <td style="font-weight: bold; color: ${r.rank <= 8 ? 'green' : 'black'};">${r.rank}</td>
                            <td>${r.rp}</td>
                            <td>${r.record}</td>
                        </tr>
                    `).join('')}
                </table>
                <p style="text-align: center; margin-top: 20px; color: #666;">רענן את העמוד לעדכון הנתונים | בהצלחה לגלקסיה!</p>
            </dir>
        `);
    } catch (e) { res.status(500).send("שגיאה: " + e.message); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));