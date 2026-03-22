// ══════════════════════════════════════════════════════════════
// ENERGY SYSTEM — Internationalisation (i18n)
// Usage :
//   t('clé')                → chaîne traduite
//   ti('clé', { var })      → chaîne avec interpolation
//   setLang('en')           → change la langue + re-render
//   applyTranslations()     → met à jour les éléments [data-i18n]
// ══════════════════════════════════════════════════════════════

const TRANSLATIONS = {

  // ════════════════════════════════════════════════════════════
  // FRANÇAIS (langue par défaut)
  // ════════════════════════════════════════════════════════════
  fr: {

    // ── App / loading ──────────────────────────────────────────
    loading:                      'Chargement…',
    app_tagline:                  'Gestionnaire de campagne pour le jeu de rôle Energy System',

    // ── Auth ──────────────────────────────────────────────────
    auth_login_discord:           'Se connecter avec Discord',
    auth_redirecting:             'Redirection vers Discord…',
    auth_error_prefix:            'Erreur de connexion Discord : ',

    // ── Navigation (topbar) ───────────────────────────────────
    nav_characters:               'Personnages',
    nav_chronicles:               'Chroniques',
    nav_documents:                'Documents',
    topbar_share:                 'Partager',

    // ── User menu ─────────────────────────────────────────────
    user_logout:                  'Se déconnecter',

    // ── Boutons génériques ────────────────────────────────────
    btn_save:                     'Sauvegarder',
    btn_cancel:                   'Annuler',
    btn_edit:                     'Modifier',
    btn_delete:                   'Supprimer',
    btn_copy:                     'Copier',
    btn_preview:                  'Aperçu',
    btn_new:                      'Nouveau',
    btn_subscribe:                'S\'abonner',
    btn_unsubscribe:              'Se désabonner',
    btn_follow:                   '+ Suivre un personnage',
    btn_follow_chr:               '+ S\'abonner',
    btn_follow_doc:               '+ S\'abonner',

    // ── Visibilité ────────────────────────────────────────────
    visibility_public:            '🔗 Public',
    visibility_private:           '🔒 Privé',
    visibility_public_chr:        '🔗 Publique',
    visibility_private_chr:       '🔒 Privée',
    followed_badge:               '👁 Suivi',
    share_code_active:            'Public (lien de partage actif)',
    share_code_inactive:          'Privé',
    share_code_active_chr:        'Public (abonnement actif)',
    share_code_inactive_chr:      'Privée',
    share_code_active_doc:        'Public (abonnement actif)',
    share_code_inactive_doc:      'Privé',

    // ── Toast messages ────────────────────────────────────────
    toast_char_saved:             'Personnage sauvegardé !',
    toast_char_deleted_error:     'Erreur lors de la suppression.',
    toast_char_save_error:        'Erreur lors de la sauvegarde.',
    toast_char_not_found:         'Code introuvable ou personnage non public.',
    toast_char_own:               'C\'est votre propre personnage !',
    toast_char_already_followed:  'Vous suivez déjà ce personnage.',
    toast_char_follow_error:      'Erreur lors du suivi.',
    toast_char_added:             '"${name}" ajouté à votre liste !',
    toast_char_unfollowed:        'Personnage retiré de la liste.',
    toast_illus_too_large:        'Image trop lourde (max 3 Mo).',
    toast_illus_upload_error:     'Erreur upload : ',
    toast_illus_added:            'Illustration ajoutée !',
    toast_upload_no_user:         'Erreur : utilisateur non connecté.',
    toast_chr_saved:              'Chronique sauvegardée !',
    toast_chr_save_error:         'Erreur lors de la sauvegarde.',
    toast_chr_delete_error:       'Erreur lors de la suppression.',
    toast_chr_not_found:          'Code introuvable ou chronique non publique.',
    toast_chr_own:                'C\'est votre propre chronique !',
    toast_chr_already_followed:   'Vous suivez déjà cette chronique.',
    toast_chr_follow_error:       'Erreur lors de l\'abonnement.',
    toast_chr_subscribed:         'Abonné à "${title}" !',
    toast_chr_unsubscribed:       'Abonnement supprimé.',
    toast_entry_saved:            'Entrée sauvegardée !',
    toast_entry_save_error:       'Erreur lors de la sauvegarde.',
    toast_entry_delete_error:     'Erreur lors de la suppression.',
    toast_entry_not_found:        'Entrée introuvable.',
    toast_doc_saved:              'Document sauvegardé !',
    toast_doc_save_error:         'Erreur lors de la sauvegarde.',
    toast_doc_delete_error:       'Erreur lors de la suppression.',
    toast_doc_not_found:          'Code introuvable ou document non public.',
    toast_doc_own:                'C\'est votre propre document !',
    toast_doc_already_followed:   'Vous suivez déjà ce document.',
    toast_doc_follow_error:       'Erreur lors de l\'abonnement.',
    toast_doc_subscribed:         'Abonné à "${title}" !',
    toast_doc_unsubscribed:       'Abonnement supprimé.',
    toast_tag_error:              'Erreur création tag.',
    toast_tag_add_error:          'Erreur lors de l\'ajout du tag.',
    toast_code_copied:            'Code "${code}" copié !',
    toast_code_copied_short:      'Code "${code}" copié dans le presse-papier !',
    toast_url_copied:             'Lien copié dans le presse-papier !',
    toast_share_need_public:      'Activez le partage public pour ce personnage, puis sauvegardez.',
    toast_share_need_save:        'Sauvegardez d\'abord le personnage pour générer son code de partage.',
    toast_chr_share_need_public:  'Activez le partage public, puis sauvegardez.',
    toast_chr_share_need_save:    'Sauvegardez d\'abord pour générer le code.',

    // ── Confirm dialogs ───────────────────────────────────────
    confirm_delete_char:          'Supprimer "${name}" ?',
    confirm_delete_chr:           'Supprimer "${title}" et toutes ses entrées ?',
    confirm_delete_entry:         'Supprimer "${title}" ?',
    confirm_delete_doc:           'Supprimer "${title}" ?',

    // ── Alert dialogs ─────────────────────────────────────────
    alert_char_no_name:           'Veuillez donner un nom au personnage.',
    alert_chr_no_title:           'Donnez un titre à la chronique.',
    alert_entry_no_title:         'Donnez un titre à cette entrée.',
    alert_doc_no_title:           'Donnez un titre au document.',

    // ── Save indicator ────────────────────────────────────────
    save_saving:                  'Enregistrement…',
    save_saved:                   'Sauvegardé ✓',
    save_error:                   'Erreur !',

    // ══════════════════════════════════════════════════════════
    // ROSTER (vue liste personnages)
    // ══════════════════════════════════════════════════════════
    roster_title:                 'Personnages',
    roster_subtitle:              'Base de données de personnages',
    roster_new_char:              'Nouveau personnage',
    roster_follow_placeholder:    'Code de partage (ex: A3F8C2D1)',
    roster_empty_title:           'Aucun personnage',
    roster_empty_body:            'Créez votre premier personnage pour commencer votre base de données de super-héros.',
    roster_empty_btn:             'Créer un personnage',
    roster_filter_label:          'Filtrer',
    roster_filter_clear:          'Tout afficher',
    roster_filter_followed:       '👁 Suivi',
    followed_owner_prefix:        'par ',
    shared_view_banner:           'Personnage partagé — consultation uniquement',

    // ── Carte personnage ──────────────────────────────────────
    card_rank:                    'Rang ',
    card_attr_energy:             'Énergie',
    card_attr_recovery:           'Récup.',
    card_attr_vigor:              'Vigueur',
    card_manage_tags:             'Gérer les tags',
    card_unfollow:                'Ne plus suivre',

    // ══════════════════════════════════════════════════════════
    // ÉDITEUR PERSONNAGE
    // ══════════════════════════════════════════════════════════
    editor_section_illus:         'Illustration',
    editor_illus_placeholder:     'Cliquez pour ajouter une illustration',
    editor_illus_change:          'Changer',
    editor_illus_remove:          'Supprimer',
    editor_illus_uploading:       'Upload en cours…',
    editor_illus_slider:          'Cadrage',

    editor_section_identity:      'Identité',
    editor_field_name:            'Nom du personnage',
    editor_field_name_ph:         'Ex: Kitsune',
    editor_field_subtitle:        'Identité réelle',
    editor_field_subtitle_ph:     'Ex: Jane Doe, étudiante en art',
    editor_field_rank:            'Rang de puissance initial',
    editor_field_maturity:        'Maturité initiale',
    editor_field_public:          'Partage public',

    editor_section_attrs:         'Attributs',
    editor_attr_energy:           'Énergie',
    editor_attr_energy_cost:      '(2 pts/+1)',
    editor_attr_recovery:         'Récupération',
    editor_attr_recovery_cost:    '(3 pts/+1)',
    editor_attr_vigor:            'Vigueur',
    editor_attr_vigor_cost:       '(1 pt/+1)',
    editor_pts_hero:              'Points de héros',

    editor_section_powers:        'Pouvoirs',
    editor_power_name_ph:         'Nom du pouvoir',
    editor_power_desc_ph:         'Description courte (optionnelle)',
    editor_add_power:             '+ Ajouter un pouvoir',

    editor_section_aptitudes:     'Aptitudes',
    editor_pts_aptitudes:         'Points d\'aptitudes',

    editor_section_traits:        'Traits',
    editor_trait_name_ph:         'Nom du trait',
    editor_add_trait:             '+ Ajouter un trait',

    editor_section_complications: 'Complications',
    editor_complications_max:     '(max 5)',
    editor_complication_name_ph:  'Nom de la complication',
    editor_complication_detail_ph:'Détails (optionnel)',
    editor_add_complication:      '+ Ajouter une complication',

    editor_section_background:    'Background',
    editor_background_ph:         'Histoire du personnage, origines, motivations…',

    editor_section_tags:          'Tags',
    editor_tag_ph:                'Ajouter un tag…',
    editor_tag_create_hint:       'Créer',

    editor_section_xp:            'Expérience',
    editor_xp_hero_label:         'Pts de héros bonus',
    editor_xp_hero_detail:        'S\'ajoutent au budget du rang',
    editor_xp_apt_label:          'Pts d\'aptitudes bonus',
    editor_xp_apt_detail:         'S\'ajoutent au budget de maturité',

    editor_mobile_edit:           '✏️ Éditer',
    editor_mobile_preview:        '👁 Aperçu',

    // ── Rangs ─────────────────────────────────────────────────
    rank_1:                       'Rang 1 — Civils (9 pts)',
    rank_2:                       'Rang 2 — Flics & Voyous (17 pts)',
    rank_3:                       'Rang 3 — Agents spéciaux (24 pts)',
    rank_4:                       'Rang 4 — Supers mineurs (32 pts)',
    rank_5:                       'Rang 5 — Supers débutants (39 pts)',
    rank_6:                       'Rang 6 — Supers compétents (47 pts)',
    rank_7:                       'Rang 7 — Supers reconnus (54 pts)',
    rank_8:                       'Rang 8 — Supers puissants (62 pts)',
    rank_9:                       'Rang 9 — Supers majeurs (69 pts)',
    rank_10:                      'Rang 10 — Plus puissants sur Terre (77 pts)',
    rank_11:                      'Rang 11+ — Cosmiques (84+ pts)',
    rank_label:                   'Rang ',

    // ── Maturités ─────────────────────────────────────────────
    maturity_adolescent:          'Adolescent (12 pts d\'aptitudes)',
    maturity_adulte:              'Adulte (16 pts d\'aptitudes)',
    maturity_veteran:             'Vétéran (20 pts d\'aptitudes)',

    // ── Types de pouvoir ──────────────────────────────────────
    power_type_offc:              'Off-C',
    power_type_offd:              'Off-D',
    power_type_def:               'Def',
    power_type_mov:               'Mov',
    power_type_sup:               'Sup',
    power_type_offc_desc:         'Offensif contact',
    power_type_offd_desc:         'Offensif distance',
    power_type_def_desc:          'Défensif',
    power_type_mov_desc:          'Mouvement',
    power_type_sup_desc:          'Support',

    // ── Modificateurs de pouvoir ──────────────────────────────
    mod_none:                     'Aucun',

    // ── Aptitudes (noms) ──────────────────────────────────────
    aptitude_art:                 'Art',
    aptitude_athletisme:          'Athlétisme',
    aptitude_bagout:              'Bagout',
    aptitude_filouterie:          'Filouterie',
    aptitude_medecine:            'Médecine',
    aptitude_nature:              'Nature',
    aptitude_occultisme:          'Occultisme',
    aptitude_sciences_exactes:    'Sciences exactes',
    aptitude_sciences_humaines:   'Sciences humaines',
    aptitude_technologie:         'Technologie',
    aptitude_vehicules:           'Véhicules',
    aptitude_vigilance:           'Vigilance',

    // ── Preview personnage ────────────────────────────────────
    preview_attr_energy:          'Énergie',
    preview_attr_recovery:        'Récupération',
    preview_attr_vigor:           'Vigueur',
    preview_section_attrs:        'Attributs',
    preview_section_powers:       'Pouvoirs',
    preview_section_aptitudes:    'Aptitudes',
    preview_section_traits:       'Traits',
    preview_section_complications:'Complications',
    preview_section_background:   'Background',
    preview_attr_cost_energy:     'pts de héros',
    preview_attr_cost_recovery:   'pts de héros',
    preview_attr_cost_vigor:      'pts de héros',

    // ══════════════════════════════════════════════════════════
    // CHRONIQUES
    // ══════════════════════════════════════════════════════════
    chr_title:                    'Chroniques',
    chr_subtitle:                 'Récits de campagne',
    chr_new_btn:                  'Nouvelle chronique',
    chr_follow_placeholder:       'Code de partage (ex: A3F8C2D1)',
    chr_empty_title:              'Aucune chronique',
    chr_empty_body:               'Rédigez le récit de vos aventures ou abonnez-vous aux chroniques d\'autres joueurs.',
    chr_empty_btn:                'Créer une chronique',

    chr_entry_count_zero:         'Aucune entrée',
    chr_entry_count_one:          '1 entrée',
    chr_entry_count_many:         '${n} entrées',
    chr_last_update:              'Mise à jour le ',
    chr_followed_owner:           'par ',

    chr_editor_field_title:       'Titre de la chronique',
    chr_editor_field_title_ph:    'Ex: Campagne — Ombre de New York',
    chr_editor_field_desc:        'Description',
    chr_editor_field_desc_ph:     'Quelques mots pour présenter cette chronique…',
    chr_editor_public:            'Partage public',
    chr_preview_hint:             'Les entrées s\'ajoutent depuis la vue de la chronique.',

    chr_detail_btn_edit:          'Modifier',
    chr_detail_btn_new_entry:     'Nouvelle entrée',
    chr_no_entries:               'Aucune entrée pour l\'instant.',

    entry_title_ph:               'Titre de l\'entrée',
    entry_content_ph:             'Rédigez votre entrée en Markdown…',
    entry_mobile_edit:            '✏️ Éditer',
    entry_mobile_preview:         '👁 Aperçu',
    entry_md_hint_title:          '# Titre',
    entry_md_hint_subtitle:       '## Sous-titre',
    entry_md_hint_bold:           '**gras**',
    entry_md_hint_italic:         '*italique*',
    entry_md_hint_quote:          '> citation',
    entry_md_hint_separator:      '--- séparateur',
    entry_preview_empty:          'Commencez à écrire…',

    // ══════════════════════════════════════════════════════════
    // DOCUMENTS
    // ══════════════════════════════════════════════════════════
    doc_title:                    'Documents',
    doc_subtitle:                 'Documents de campagne',
    doc_new_btn:                  'Nouveau document',
    doc_follow_placeholder:       'Code de partage (ex: A3F8C2D1)',
    doc_empty_title:              'Aucun document',
    doc_empty_body:               'Créez vos premiers documents de campagne ou abonnez-vous à ceux d\'autres joueurs.',
    doc_empty_btn:                'Créer un document',

    doc_editor_illus_section:     'Illustration d\'en-tête',
    doc_editor_title_ph:          'Titre du document',
    doc_editor_public:            'Partage public',
    doc_editor_content_ph:        'Rédigez votre document en Markdown…',
    doc_editor_mobile_edit:       '✏️ Éditer',
    doc_editor_mobile_preview:    '👁 Aperçu',
    doc_md_hint_title:            '# Titre',
    doc_md_hint_section:          '## Section',
    doc_md_hint_bold:             '**gras**',
    doc_md_hint_italic:           '*italique*',
    doc_md_hint_quote:            '> citation',
    doc_md_hint_image:            '![alt](url) image',
    doc_md_hint_separator:        '--- séparateur',
    doc_preview_empty:            'Commencez à écrire…',
    doc_reader_banner:            'Document partagé — lecture seule',

    // ══════════════════════════════════════════════════════════
    // TAGS (modale personnages suivis)
    // ══════════════════════════════════════════════════════════
    followed_tags_modal_label:    'Tags locaux',
    followed_tags_input_ph:       'Ajouter un tag…',
    followed_tags_close:          'Fermer',

    // ══════════════════════════════════════════════════════════
    // PARTAGE
    // ══════════════════════════════════════════════════════════
    share_copy_btn:               'Copier',
    share_code_prompt:            'Code de partage à transmettre :',
    share_code_prompt_short:      'Code de partage :',

  },

  // ════════════════════════════════════════════════════════════
  // ENGLISH
  // ════════════════════════════════════════════════════════════
  en: {

    // ── App / loading ──────────────────────────────────────────
    loading:                      'Loading…',
    app_tagline:                  'Campaign manager for the Energy System tabletop RPG',

    // ── Auth ──────────────────────────────────────────────────
    auth_login_discord:           'Log in with Discord',
    auth_redirecting:             'Redirecting to Discord…',
    auth_error_prefix:            'Discord login error: ',

    // ── Navigation (topbar) ───────────────────────────────────
    nav_characters:               'Characters',
    nav_chronicles:               'Chronicles',
    nav_documents:                'Documents',
    topbar_share:                 'Share',

    // ── User menu ─────────────────────────────────────────────
    user_logout:                  'Log out',

    // ── Boutons génériques ────────────────────────────────────
    btn_save:                     'Save',
    btn_cancel:                   'Cancel',
    btn_edit:                     'Edit',
    btn_delete:                   'Delete',
    btn_copy:                     'Copy',
    btn_preview:                  'Preview',
    btn_new:                      'New',
    btn_subscribe:                'Subscribe',
    btn_unsubscribe:              'Unsubscribe',
    btn_follow:                   '+ Follow a character',
    btn_follow_chr:               '+ Subscribe',
    btn_follow_doc:               '+ Subscribe',

    // ── Visibilité ────────────────────────────────────────────
    visibility_public:            '🔗 Public',
    visibility_private:           '🔒 Private',
    visibility_public_chr:        '🔗 Public',
    visibility_private_chr:       '🔒 Private',
    followed_badge:               '👁 Following',
    share_code_active:            'Public (share link active)',
    share_code_inactive:          'Private',
    share_code_active_chr:        'Public (subscriptions open)',
    share_code_inactive_chr:      'Private',
    share_code_active_doc:        'Public (subscriptions open)',
    share_code_inactive_doc:      'Private',

    // ── Toast messages ────────────────────────────────────────
    toast_char_saved:             'Character saved!',
    toast_char_deleted_error:     'Error while deleting.',
    toast_char_save_error:        'Error while saving.',
    toast_char_not_found:         'Code not found or character is not public.',
    toast_char_own:               'That\'s your own character!',
    toast_char_already_followed:  'You\'re already following this character.',
    toast_char_follow_error:      'Error while following.',
    toast_char_added:             '"${name}" added to your roster!',
    toast_char_unfollowed:        'Character removed from roster.',
    toast_illus_too_large:        'Image too large (max 3 MB).',
    toast_illus_upload_error:     'Upload error: ',
    toast_illus_added:            'Illustration added!',
    toast_upload_no_user:         'Error: user not logged in.',
    toast_chr_saved:              'Chronicle saved!',
    toast_chr_save_error:         'Error while saving.',
    toast_chr_delete_error:       'Error while deleting.',
    toast_chr_not_found:          'Code not found or chronicle is not public.',
    toast_chr_own:                'That\'s your own chronicle!',
    toast_chr_already_followed:   'You\'re already subscribed to this chronicle.',
    toast_chr_follow_error:       'Error while subscribing.',
    toast_chr_subscribed:         'Subscribed to "${title}"!',
    toast_chr_unsubscribed:       'Subscription removed.',
    toast_entry_saved:            'Entry saved!',
    toast_entry_save_error:       'Error while saving.',
    toast_entry_delete_error:     'Error while deleting.',
    toast_entry_not_found:        'Entry not found.',
    toast_doc_saved:              'Document saved!',
    toast_doc_save_error:         'Error while saving.',
    toast_doc_delete_error:       'Error while deleting.',
    toast_doc_not_found:          'Code not found or document is not public.',
    toast_doc_own:                'That\'s your own document!',
    toast_doc_already_followed:   'You\'re already subscribed to this document.',
    toast_doc_follow_error:       'Error while subscribing.',
    toast_doc_subscribed:         'Subscribed to "${title}"!',
    toast_doc_unsubscribed:       'Subscription removed.',
    toast_tag_error:              'Error creating tag.',
    toast_tag_add_error:          'Error while adding tag.',
    toast_code_copied:            'Code "${code}" copied!',
    toast_code_copied_short:      'Code "${code}" copied to clipboard!',
    toast_url_copied:             'Link copied to clipboard!',
    toast_share_need_public:      'Enable public sharing for this character, then save first.',
    toast_share_need_save:        'Save the character first to generate its share code.',
    toast_chr_share_need_public:  'Enable public sharing, then save first.',
    toast_chr_share_need_save:    'Save first to generate the code.',

    // ── Confirm dialogs ───────────────────────────────────────
    confirm_delete_char:          'Delete "${name}"?',
    confirm_delete_chr:           'Delete "${title}" and all its entries?',
    confirm_delete_entry:         'Delete "${title}"?',
    confirm_delete_doc:           'Delete "${title}"?',

    // ── Alert dialogs ─────────────────────────────────────────
    alert_char_no_name:           'Please give the character a name.',
    alert_chr_no_title:           'Give the chronicle a title.',
    alert_entry_no_title:         'Give this entry a title.',
    alert_doc_no_title:           'Give the document a title.',

    // ── Save indicator ────────────────────────────────────────
    save_saving:                  'Saving…',
    save_saved:                   'Saved ✓',
    save_error:                   'Error!',

    // ══════════════════════════════════════════════════════════
    // ROSTER
    // ══════════════════════════════════════════════════════════
    roster_title:                 'Roster',
    roster_subtitle:              'Character database',
    roster_new_char:              'New character',
    roster_follow_placeholder:    'Share code (e.g. A3F8C2D1)',
    roster_empty_title:           'No characters yet',
    roster_empty_body:            'Create your first character to start your superhero database.',
    roster_empty_btn:             'Create a character',
    roster_filter_label:          'Filter',
    roster_filter_clear:          'Show all',
    roster_filter_followed:       '👁 Following',
    followed_owner_prefix:        'by ',
    shared_view_banner:           'Shared character — read only',

    // ── Carte personnage ──────────────────────────────────────
    card_rank:                    'Rank ',
    card_attr_energy:             'Energy',
    card_attr_recovery:           'Recov.',
    card_attr_vigor:              'Vigor',
    card_manage_tags:             'Manage tags',
    card_unfollow:                'Unfollow',

    // ══════════════════════════════════════════════════════════
    // ÉDITEUR PERSONNAGE
    // ══════════════════════════════════════════════════════════
    editor_section_illus:         'Illustration',
    editor_illus_placeholder:     'Click to add an illustration',
    editor_illus_change:          'Change',
    editor_illus_remove:          'Remove',
    editor_illus_uploading:       'Uploading…',
    editor_illus_slider:          'Framing',

    editor_section_identity:      'Identity',
    editor_field_name:            'Character name',
    editor_field_name_ph:         'E.g. Kitsune',
    editor_field_subtitle:        'Real identity',
    editor_field_subtitle_ph:     'E.g. Jane Doe, art student',
    editor_field_rank:            'Starting power rank',
    editor_field_maturity:        'Starting maturity',
    editor_field_public:          'Public sharing',

    editor_section_attrs:         'Attributes',
    editor_attr_energy:           'Energy',
    editor_attr_energy_cost:      '(2 pts/+1)',
    editor_attr_recovery:         'Recovery',
    editor_attr_recovery_cost:    '(3 pts/+1)',
    editor_attr_vigor:            'Vigor',
    editor_attr_vigor_cost:       '(1 pt/+1)',
    editor_pts_hero:              'Hero points',

    editor_section_powers:        'Powers',
    editor_power_name_ph:         'Power name',
    editor_power_desc_ph:         'Short description (optional)',
    editor_add_power:             '+ Add a power',

    editor_section_aptitudes:     'Aptitudes',
    editor_pts_aptitudes:         'Aptitude points',

    editor_section_traits:        'Traits',
    editor_trait_name_ph:         'Trait name',
    editor_add_trait:             '+ Add a trait',

    editor_section_complications: 'Complications',
    editor_complications_max:     '(max 5)',
    editor_complication_name_ph:  'Complication name',
    editor_complication_detail_ph:'Details (optional)',
    editor_add_complication:      '+ Add a complication',

    editor_section_background:    'Background',
    editor_background_ph:         'Character history, origins, motivations…',

    editor_section_tags:          'Tags',
    editor_tag_ph:                'Add a tag…',
    editor_tag_create_hint:       'Create',

    editor_section_xp:            'Experience',
    editor_xp_hero_label:         'Bonus hero pts',
    editor_xp_hero_detail:        'Added to rank budget',
    editor_xp_apt_label:          'Bonus aptitude pts',
    editor_xp_apt_detail:         'Added to maturity budget',

    editor_mobile_edit:           '✏️ Edit',
    editor_mobile_preview:        '👁 Preview',

    // ── Rangs ─────────────────────────────────────────────────
    rank_1:                       'Rank 1 — Civilians (9 pts)',
    rank_2:                       'Rank 2 — Cops & Thugs (17 pts)',
    rank_3:                       'Rank 3 — Special Agents (24 pts)',
    rank_4:                       'Rank 4 — Minor Supers (32 pts)',
    rank_5:                       'Rank 5 — Rookie Supers (39 pts)',
    rank_6:                       'Rank 6 — Capable Supers (47 pts)',
    rank_7:                       'Rank 7 — Renowned Supers (54 pts)',
    rank_8:                       'Rank 8 — Powerful Supers (62 pts)',
    rank_9:                       'Rank 9 — Major Supers (69 pts)',
    rank_10:                      'Rank 10 — Earth\'s Mightiest (77 pts)',
    rank_11:                      'Rank 11+ — Cosmic (84+ pts)',
    rank_label:                   'Rank ',

    // ── Maturités ─────────────────────────────────────────────
    maturity_adolescent:          'Teenager (12 aptitude pts)',
    maturity_adulte:              'Adult (16 aptitude pts)',
    maturity_veteran:             'Veteran (20 aptitude pts)',

    // ── Types de pouvoir ──────────────────────────────────────
    power_type_offc:              'Off-C',
    power_type_offd:              'Off-D',
    power_type_def:               'Def',
    power_type_mov:               'Mov',
    power_type_sup:               'Sup',
    power_type_offc_desc:         'Melee offensive',
    power_type_offd_desc:         'Ranged offensive',
    power_type_def_desc:          'Defensive',
    power_type_mov_desc:          'Movement',
    power_type_sup_desc:          'Support',

    // ── Modificateurs de pouvoir ──────────────────────────────
    mod_none:                     'None',

    // ── Aptitudes (noms) ──────────────────────────────────────
    aptitude_art:                 'Art',
    aptitude_athletisme:          'Athletics',
    aptitude_bagout:              'Persuasion',
    aptitude_filouterie:          'Trickery',
    aptitude_medecine:            'Medicine',
    aptitude_nature:              'Nature',
    aptitude_occultisme:          'Occultism',
    aptitude_sciences_exactes:    'Hard Sciences',
    aptitude_sciences_humaines:   'Social Sciences',
    aptitude_technologie:         'Technology',
    aptitude_vehicules:           'Vehicles',
    aptitude_vigilance:           'Vigilance',

    // ── Preview personnage ────────────────────────────────────
    preview_attr_energy:          'Energy',
    preview_attr_recovery:        'Recovery',
    preview_attr_vigor:           'Toughness',
    preview_section_attrs:        'Attributes',
    preview_section_powers:       'Powers',
    preview_section_aptitudes:    'Skills',
    preview_section_traits:       'Traits',
    preview_section_complications:'Complications',
    preview_section_background:   'Background',
    preview_attr_cost_energy:     'hero pts',
    preview_attr_cost_recovery:   'hero pts',
    preview_attr_cost_vigor:      'hero pts',

    // ══════════════════════════════════════════════════════════
    // CHRONIQUES
    // ══════════════════════════════════════════════════════════
    chr_title:                    'Chronicles',
    chr_subtitle:                 'Campaign stories',
    chr_new_btn:                  'New chronicle',
    chr_follow_placeholder:       'Share code (e.g. A3F8C2D1)',
    chr_empty_title:              'No chronicles yet',
    chr_empty_body:               'Write your adventure stories or subscribe to other players\' chronicles.',
    chr_empty_btn:                'Create a chronicle',

    chr_entry_count_zero:         'No entries',
    chr_entry_count_one:          '1 entry',
    chr_entry_count_many:         '${n} entries',
    chr_last_update:              'Updated on ',
    chr_followed_owner:           'by ',

    chr_editor_field_title:       'Chronicle title',
    chr_editor_field_title_ph:    'E.g. Campaign — Shadow of New York',
    chr_editor_field_desc:        'Description',
    chr_editor_field_desc_ph:     'A few words to introduce this chronicle…',
    chr_editor_public:            'Public sharing',
    chr_preview_hint:             'Entries are added from the chronicle view.',

    chr_detail_btn_edit:          'Edit',
    chr_detail_btn_new_entry:     'New entry',
    chr_no_entries:               'No entries yet.',

    entry_title_ph:               'Entry title',
    entry_content_ph:             'Write your entry in Markdown…',
    entry_mobile_edit:            '✏️ Edit',
    entry_mobile_preview:         '👁 Preview',
    entry_md_hint_title:          '# Title',
    entry_md_hint_subtitle:       '## Subtitle',
    entry_md_hint_bold:           '**bold**',
    entry_md_hint_italic:         '*italic*',
    entry_md_hint_quote:          '> quote',
    entry_md_hint_separator:      '--- separator',
    entry_preview_empty:          'Start writing…',

    // ══════════════════════════════════════════════════════════
    // DOCUMENTS
    // ══════════════════════════════════════════════════════════
    doc_title:                    'Documents',
    doc_subtitle:                 'Campaign documents',
    doc_new_btn:                  'New document',
    doc_follow_placeholder:       'Share code (e.g. A3F8C2D1)',
    doc_empty_title:              'No documents yet',
    doc_empty_body:               'Create your first campaign documents or subscribe to other players\'.',
    doc_empty_btn:                'Create a document',

    doc_editor_illus_section:     'Header illustration',
    doc_editor_title_ph:          'Document title',
    doc_editor_public:            'Public sharing',
    doc_editor_content_ph:        'Write your document in Markdown…',
    doc_editor_mobile_edit:       '✏️ Edit',
    doc_editor_mobile_preview:    '👁 Preview',
    doc_md_hint_title:            '# Title',
    doc_md_hint_section:          '## Section',
    doc_md_hint_bold:             '**bold**',
    doc_md_hint_italic:           '*italic*',
    doc_md_hint_quote:            '> quote',
    doc_md_hint_image:            '![alt](url) image',
    doc_md_hint_separator:        '--- separator',
    doc_preview_empty:            'Start writing…',
    doc_reader_banner:            'Shared document — read only',

    // ══════════════════════════════════════════════════════════
    // TAGS
    // ══════════════════════════════════════════════════════════
    followed_tags_modal_label:    'Local tags',
    followed_tags_input_ph:       'Add a tag…',
    followed_tags_close:          'Close',

    // ══════════════════════════════════════════════════════════
    // PARTAGE
    // ══════════════════════════════════════════════════════════
    share_copy_btn:               'Copy',
    share_code_prompt:            'Share code to send:',
    share_code_prompt_short:      'Share code:',

  },
};

// ══════════════════════════════════════════════════════════════
// MOTEUR i18n
// ══════════════════════════════════════════════════════════════

let currentLang = localStorage.getItem('lang') || 'fr';

/**
 * Retourne la chaîne traduite pour la clé donnée.
 * Repli sur le français si la clé n'existe pas dans la langue active.
 * @param {string} key
 * @returns {string}
 */
function t(key) {
  return TRANSLATIONS[currentLang]?.[key]
    ?? TRANSLATIONS['fr'][key]
    ?? key;
}

/**
 * Retourne la chaîne traduite avec interpolation des variables.
 * @param {string} key
 * @param {Object} vars  - ex: { name: 'Kitsune', code: 'A3B4C5D6' }
 * @returns {string}
 * @example ti('toast_char_added', { name: 'Kitsune' })
 */
function ti(key, vars) {
  return t(key).replace(/\$\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

/**
 * Change la langue active, la persiste et met à jour le DOM statique.
 * @param {string} lang  - code langue ('fr' | 'en')
 */
function setLang(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem('lang', lang);
  applyTranslations();
  const sel = document.getElementById('lang-select');
  if (sel) sel.value = lang;
}

/**
 * Met à jour tous les éléments portant l'attribut [data-i18n] dans le DOM.
 * À appeler après setLang() et après chaque showView() si nécessaire.
 */
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const attr = el.dataset.i18nAttr;
    const value = t(key);
    if (attr) el.setAttribute(attr, value);
    else el.textContent = value;
  });
}

// ── Initialisation au chargement ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const sel = document.getElementById('lang-select');
  if (sel) sel.value = currentLang;
  applyTranslations();
});
