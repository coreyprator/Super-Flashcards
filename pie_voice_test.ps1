# PIE Voice Comparison Test
# Generates audio for multiple ElevenLabs voices across key PIE phonemes
# Run from PowerShell, then open pie_voice_scorer.html in a browser

$apiKey = (gcloud secrets versions access latest --secret=ELEVENLABS_API_KEY --project=super-flashcards-475210).Trim()
$outDir = "$env:USERPROFILE\Desktop\pie-voice-test"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# Voices to test (all work with eleven_monolingual_v1 + IPA phoneme tags)
$voices = @(
    @{ id = "pNInz6obpgDQGcFmaJgB"; name = "Adam";    slug = "adam"    },
    @{ id = "ErXwobaYiN019PkySvjV"; name = "Antoni";  slug = "antoni"  },
    @{ id = "TxGEqnHWrfWFTfGW9XjX"; name = "Josh";    slug = "josh"    },
    @{ id = "VR6AewLTigWG4xSOukaG"; name = "Arnold";  slug = "arnold"  },
    @{ id = "21m00Tcm4TlvDq8ikWAM"; name = "Rachel";  slug = "rachel"  }
)

# Test cases — each tests a different phoneme challenge
$tests = @(
    @{ id = "t01"; label = "*per-";     ipa = "pɛr";        desc = "Simple CVC — Continental /ɛ/ + trill /r/ (the failing case)";  slug = "per"     },
    @{ id = "t02"; label = "*bʰer-";    ipa = "bʱɛr";       desc = "Aspirated stop /bʱ/ — breathy voiced bilabial";               slug = "bher"    },
    @{ id = "t03"; label = "*h₂stḗr";   ipa = "xˈsteːr";    desc = "Laryngeal /x/ onset + long vowel /eː/ — star";               slug = "hster"   },
    @{ id = "t04"; label = "*méh₂tēr";  ipa = "ˈmeːxteːr";  desc = "Full laryngeal word — mother (the confirmed-working case)";   slug = "mehter"  },
    @{ id = "t05"; label = "*wódr̥";     ipa = "ˈwodər";     desc = "Syllabic resonant /r̩/ → /ər/ — water";                      slug = "wodr"    },
    @{ id = "t06"; label = "*ǵénh₁-";   ipa = "ɡʲɛnʔ";     desc = "Palatovelar /ɡʲ/ + glottal /ʔ/ — to beget/birth";            slug = "genh"    },
    @{ id = "t07"; label = "*sed-";     ipa = "sɛd";        desc = "Dental stop /d/ — to sit (baseline simple)";                  slug = "sed"     },
    @{ id = "t08"; label = "*dʰébʰ-";   ipa = "dʱɛbʱ";     desc = "Two aspirated stops — double aspirate test";                  slug = "dhebh"   }
)

$model = "eleven_monolingual_v1"
$total  = $voices.Count * $tests.Count
$done   = 0

foreach ($v in $voices) {
    New-Item -ItemType Directory -Force -Path "$outDir\$($v.slug)" | Out-Null

    foreach ($t in $tests) {
        $done++
        $outPath = "$outDir\$($v.slug)\$($t.slug).mp3"
        $ssml    = "<speak><phoneme alphabet=`"ipa`" ph=`"$($t.ipa)`">$($t.slug)</phoneme></speak>"

        Write-Host "[$done/$total] $($v.name) — $($t.label) ($($t.ipa))..."

        $bodyJson = @{
            text           = $ssml
            model_id       = $model
            voice_settings = @{ stability = 0.75; similarity_boost = 0.75 }
        } | ConvertTo-Json -Depth 5

        try {
            Invoke-RestMethod `
                -Method POST `
                -Uri "https://api.elevenlabs.io/v1/text-to-speech/$($v.id)" `
                -Headers @{ "xi-api-key" = $apiKey; "Accept" = "audio/mpeg" } `
                -ContentType "application/json" `
                -Body ([System.Text.Encoding]::UTF8.GetBytes($bodyJson)) `
                -OutFile $outPath `
                -ErrorAction Stop
            Write-Host "  OK — $outPath" -ForegroundColor Green
        } catch {
            Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
        }

        Start-Sleep -Milliseconds 600
    }
}

Write-Host "`nDone. Open $outDir\pie_voice_scorer.html to score the voices." -ForegroundColor Cyan
