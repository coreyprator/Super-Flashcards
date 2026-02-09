-- Insert Greek Diphthongs and Consonant Combinations
-- 17 flashcards total: 7 diphthongs + 10 consonant combinations

DECLARE @greek_lang_id UNIQUEIDENTIFIER = '21D23A9E-4EF7-4D53-AD17-371D164D0F0F';

-- Only insert if not already exists
IF NOT EXISTS (SELECT 1 FROM flashcards WHERE word_or_phrase = N'αι' AND language_id = @greek_lang_id)
BEGIN
    INSERT INTO flashcards (id, language_id, word_or_phrase, definition, ipa_pronunciation, etymology, english_cognates, related_words, source, created_at, updated_at)
    VALUES (NEWID(), @greek_lang_id, N'αι', N'[e] as in ''bed'' - Example: και (ke) = ''and''', N'/e/', N'Greek diphthong - always pronounced as single ''e'' sound', N'Similar to ''e'' in ''bet''', N'["και", "αίμα", "παιδί"]', 'Greek Pronunciation Import', GETDATE(), GETDATE());
    PRINT 'Inserted: αι';
END

IF NOT EXISTS (SELECT 1 FROM flashcards WHERE word_or_phrase = N'ει' AND language_id = @greek_lang_id)
BEGIN
    INSERT INTO flashcards (id, language_id, word_or_phrase, definition, ipa_pronunciation, etymology, english_cognates, related_words, source, created_at, updated_at)
    VALUES (NEWID(), @greek_lang_id, N'ει', N'[i] as in ''see'' - Example: είναι (ine) = ''is/are''', N'/i/', N'Greek diphthong - pronounced as long ''ee'' sound', N'Similar to ''ee'' in ''see''', N'["είναι", "είδα", "είκοσι"]', 'Greek Pronunciation Import', GETDATE(), GETDATE());
    PRINT 'Inserted: ει';
END

IF NOT EXISTS (SELECT 1 FROM flashcards WHERE word_or_phrase = N'οι' AND language_id = @greek_lang_id)
BEGIN
    INSERT INTO flashcards (id, language_id, word_or_phrase, definition, ipa_pronunciation, etymology, english_cognates, related_words, source, created_at, updated_at)
    VALUES (NEWID(), @greek_lang_id, N'οι', N'[i] as in ''see'' - Example: οι (i) = ''the'' (plural)', N'/i/', N'Greek diphthong - also pronounced as long ''ee'' sound (same as ει)', N'Similar to ''ee'' in ''see''', N'["οι", "ποιος", "οικογένεια"]', 'Greek Pronunciation Import', GETDATE(), GETDATE());
    PRINT 'Inserted: οι';
END

IF NOT EXISTS (SELECT 1 FROM flashcards WHERE word_or_phrase = N'υι' AND language_id = @greek_lang_id)
BEGIN
    INSERT INTO flashcards (id, language_id, word_or_phrase, definition, ipa_pronunciation, etymology, english_cognates, related_words, source, created_at, updated_at)
    VALUES (NEWID(), @greek_lang_id, N'υι', N'[i] as in ''see'' - Example: υιός (ios) = ''son''', N'/i/', N'Greek diphthong - less common, also ''ee'' sound', N'Similar to ''ee'' in ''see''', N'["υιός", "υιοθεσία"]', 'Greek Pronunciation Import', GETDATE(), GETDATE());
    PRINT 'Inserted: υι';
END

IF NOT EXISTS (SELECT 1 FROM flashcards WHERE word_or_phrase = N'αυ' AND language_id = @greek_lang_id)
BEGIN
    INSERT INTO flashcards (id, language_id, word_or_phrase, definition, ipa_pronunciation, etymology, english_cognates, related_words, source, created_at, updated_at)
    VALUES (NEWID(), @greek_lang_id, N'αυ', N'[av] before vowels/voiced consonants, [af] before voiceless - Example: αυτός (aftos) = ''he''', N'/av/ or /af/', N'CONTEXT-DEPENDENT: [af] before κ,π,τ,χ,φ,θ,σ,ξ,ψ; [av] elsewhere', N'Like ''av'' in ''have'' or ''af'' in ''after''', N'["αυτός", "αύριο", "αυγό"]', 'Greek Pronunciation Import', GETDATE(), GETDATE());
    PRINT 'Inserted: αυ';
END

IF NOT EXISTS (SELECT 1 FROM flashcards WHERE word_or_phrase = N'ευ' AND language_id = @greek_lang_id)
BEGIN
    INSERT INTO flashcards (id, language_id, word_or_phrase, definition, ipa_pronunciation, etymology, english_cognates, related_words, source, created_at, updated_at)
    VALUES (NEWID(), @greek_lang_id, N'ευ', N'[ev] before vowels/voiced consonants, [ef] before voiceless - Example: ευχαριστώ (efcharisto) = ''thank you''', N'/ev/ or /ef/', N'CONTEXT-DEPENDENT: [ef] before κ,π,τ,χ,φ,θ,σ,ξ,ψ; [ev] elsewhere', N'Like ''ev'' in ''ever'' or ''ef'' in ''effort''', N'["ευχαριστώ", "Ευρώπη", "ευτυχία"]', 'Greek Pronunciation Import', GETDATE(), GETDATE());
    PRINT 'Inserted: ευ';
END

IF NOT EXISTS (SELECT 1 FROM flashcards WHERE word_or_phrase = N'ου' AND language_id = @greek_lang_id)
BEGIN
    INSERT INTO flashcards (id, language_id, word_or_phrase, definition, ipa_pronunciation, etymology, english_cognates, related_words, source, created_at, updated_at)
    VALUES (NEWID(), @greek_lang_id, N'ου', N'[u] as in ''food'' - Example: που (pu) = ''where/that''', N'/u/', N'Greek diphthong - always ''oo'' sound', N'Similar to ''oo'' in ''food''', N'["που", "ούτε", "μου"]', 'Greek Pronunciation Import', GETDATE(), GETDATE());
    PRINT 'Inserted: ου';
END

-- Consonant Combinations
IF NOT EXISTS (SELECT 1 FROM flashcards WHERE word_or_phrase = N'ντ' AND language_id = @greek_lang_id)
BEGIN
    INSERT INTO flashcards (id, language_id, word_or_phrase, definition, ipa_pronunciation, etymology, english_cognates, related_words, source, created_at, updated_at)
    VALUES (NEWID(), @greek_lang_id, N'ντ', N'[d] at start of word, [nd] in middle - Example: ντομάτα (domata) = ''tomato''', N'/d/ or /nd/', N'POSITION-DEPENDENT: [d] word-initially, [nd] word-medially', N'Like ''d'' in ''dog'' or ''nd'' in ''and''', N'["ντομάτα", "κόντρα", "πέντε"]', 'Greek Pronunciation Import', GETDATE(), GETDATE());
    PRINT 'Inserted: ντ';
END

IF NOT EXISTS (SELECT 1 FROM flashcards WHERE word_or_phrase = N'μπ' AND language_id = @greek_lang_id)
BEGIN
    INSERT INTO flashcards (id, language_id, word_or_phrase, definition, ipa_pronunciation, etymology, english_cognates, related_words, source, created_at, updated_at)
    VALUES (NEWID(), @greek_lang_id, N'μπ', N'[b] at start of word, [mb] in middle - Example: μπάλα (bala) = ''ball''', N'/b/ or /mb/', N'POSITION-DEPENDENT: [b] word-initially, [mb] word-medially', N'Like ''b'' in ''ball'' or ''mb'' in ''number''', N'["μπάλα", "μπαμπάς", "κόμπος"]', 'Greek Pronunciation Import', GETDATE(), GETDATE());
    PRINT 'Inserted: μπ';
END

IF NOT EXISTS (SELECT 1 FROM flashcards WHERE word_or_phrase = N'γγ' AND language_id = @greek_lang_id)
BEGIN
    INSERT INTO flashcards (id, language_id, word_or_phrase, definition, ipa_pronunciation, etymology, english_cognates, related_words, source, created_at, updated_at)
    VALUES (NEWID(), @greek_lang_id, N'γγ', N'[ng] as in ''finger'' - Example: αγγελία (angelia) = ''announcement''', N'/ŋg/', N'Double gamma - nasal ''ng'' followed by hard ''g''', N'Like ''ng'' in ''finger'' (not ''singer'')', N'["αγγελία", "άγγελος", "Αγγλία"]', 'Greek Pronunciation Import', GETDATE(), GETDATE());
    PRINT 'Inserted: γγ';
END

IF NOT EXISTS (SELECT 1 FROM flashcards WHERE word_or_phrase = N'γκ' AND language_id = @greek_lang_id)
BEGIN
    INSERT INTO flashcards (id, language_id, word_or_phrase, definition, ipa_pronunciation, etymology, english_cognates, related_words, source, created_at, updated_at)
    VALUES (NEWID(), @greek_lang_id, N'γκ', N'[g] at start of word, [ng] in middle - Example: γκαράζ (garaz) = ''garage''', N'/g/ or /ŋg/', N'POSITION-DEPENDENT: [g] word-initially, [ng] word-medially', N'Like ''g'' in ''go'' or ''ng'' in ''finger''', N'["γκαράζ", "αγκαλιά", "έλεγχος"]', 'Greek Pronunciation Import', GETDATE(), GETDATE());
    PRINT 'Inserted: γκ';
END

IF NOT EXISTS (SELECT 1 FROM flashcards WHERE word_or_phrase = N'τσ' AND language_id = @greek_lang_id)
BEGIN
    INSERT INTO flashcards (id, language_id, word_or_phrase, definition, ipa_pronunciation, etymology, english_cognates, related_words, source, created_at, updated_at)
    VALUES (NEWID(), @greek_lang_id, N'τσ', N'[ts] as in ''cats'' - Example: τσάι (tsai) = ''tea''', N'/ts/', N'Greek consonant cluster - always ''ts'' sound', N'Like ''ts'' in ''cats'' or ''pizza''', N'["τσάι", "τσάντα", "πίτσα"]', 'Greek Pronunciation Import', GETDATE(), GETDATE());
    PRINT 'Inserted: τσ';
END

IF NOT EXISTS (SELECT 1 FROM flashcards WHERE word_or_phrase = N'τζ' AND language_id = @greek_lang_id)
BEGIN
    INSERT INTO flashcards (id, language_id, word_or_phrase, definition, ipa_pronunciation, etymology, english_cognates, related_words, source, created_at, updated_at)
    VALUES (NEWID(), @greek_lang_id, N'τζ', N'[dz] as in ''adze'' - Example: τζάμι (dzami) = ''window/glass''', N'/dz/', N'Greek consonant cluster - voiced ''dz'' sound', N'Like ''ds'' in ''beds'' or Italian ''z'' in ''pizza''', N'["τζάμι", "τζατζίκι", "τζάκι"]', 'Greek Pronunciation Import', GETDATE(), GETDATE());
    PRINT 'Inserted: τζ';
END

IF NOT EXISTS (SELECT 1 FROM flashcards WHERE word_or_phrase = N'ντζ' AND language_id = @greek_lang_id)
BEGIN
    INSERT INTO flashcards (id, language_id, word_or_phrase, definition, ipa_pronunciation, etymology, english_cognates, related_words, source, created_at, updated_at)
    VALUES (NEWID(), @greek_lang_id, N'ντζ', N'[ndz] as in ''hands'' - Example: πορτζιά (portza) = ''orange (tree)''', N'/ndz/', N'Greek consonant cluster - nasal plus ''dz''', N'Like ''nds'' in ''hands''', N'["πορτοκάλι", "τζιτζίκι"]', 'Greek Pronunciation Import', GETDATE(), GETDATE());
    PRINT 'Inserted: ντζ';
END

IF NOT EXISTS (SELECT 1 FROM flashcards WHERE word_or_phrase = N'ξ' AND language_id = @greek_lang_id)
BEGIN
    INSERT INTO flashcards (id, language_id, word_or_phrase, definition, ipa_pronunciation, etymology, english_cognates, related_words, source, created_at, updated_at)
    VALUES (NEWID(), @greek_lang_id, N'ξ', N'[ks] as in ''box'' - Example: ξένος (ksenos) = ''foreign/stranger''', N'/ks/', N'Single letter representing ''ks'' cluster', N'Like ''x'' in ''box'' or ''ks'' in ''thanks''', N'["ξένος", "ξέρω", "ξύλο"]', 'Greek Pronunciation Import', GETDATE(), GETDATE());
    PRINT 'Inserted: ξ';
END

IF NOT EXISTS (SELECT 1 FROM flashcards WHERE word_or_phrase = N'ψ' AND language_id = @greek_lang_id)
BEGIN
    INSERT INTO flashcards (id, language_id, word_or_phrase, definition, ipa_pronunciation, etymology, english_cognates, related_words, source, created_at, updated_at)
    VALUES (NEWID(), @greek_lang_id, N'ψ', N'[ps] as in ''lips'' - Example: ψωμί (psomi) = ''bread''', N'/ps/', N'Single letter representing ''ps'' cluster', N'Like ''ps'' in ''lips'' or ''lapse''', N'["ψωμί", "ψάρι", "ψυχή"]', 'Greek Pronunciation Import', GETDATE(), GETDATE());
    PRINT 'Inserted: ψ';
END

IF NOT EXISTS (SELECT 1 FROM flashcards WHERE word_or_phrase = N'γχ' AND language_id = @greek_lang_id)
BEGIN
    INSERT INTO flashcards (id, language_id, word_or_phrase, definition, ipa_pronunciation, etymology, english_cognates, related_words, source, created_at, updated_at)
    VALUES (NEWID(), @greek_lang_id, N'γχ', N'[ŋx] as in ''synchro'' - Example: σύγχρονος (sinchronos) = ''contemporary''', N'/ŋx/', N'Greek consonant cluster - nasal ''ng'' plus ''ch'' sound', N'Like ''nch'' in German ''München''', N'["σύγχρονος", "έλεγχος", "άγχος"]', 'Greek Pronunciation Import', GETDATE(), GETDATE());
    PRINT 'Inserted: γχ';
END

-- Show results
SELECT COUNT(*) AS 'Total Greek Pronunciation Cards'
FROM flashcards
WHERE language_id = @greek_lang_id AND source = 'Greek Pronunciation Import';
